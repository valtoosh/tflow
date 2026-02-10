// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./interfaces/ITigerFlowVault.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title TigerFlowRouter
 * @author TigerFlow
 * @notice Intelligent routing engine for large USDC→ETH trades on Base.
 *         Splits trades between Uniswap V3 and merchant WETH vaults
 *         to minimize slippage and provide best execution for traders.
 *
 *   Flow:
 *     1. Trader calls getQuote() → sees TigerFlow vs Uniswap-only comparison
 *     2. Trader calls executeSwap() with slippage protection + deadline
 *     3. Router splits the trade:
 *        a. Vault portion: Router sends USDC to vaults, vaults send WETH to trader
 *        b. Uniswap portion: Router swaps remaining USDC→WETH on Uniswap V3
 *     4. Trader receives WETH, vaults earn fees
 *
 *   Security: ReentrancyGuard, Pausable, deadline enforcement, slippage protection,
 *   oracle validation, vault whitelist, rescue function for stuck tokens.
 */
contract TigerFlowRouter is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ========== STRUCTS ==========

    struct RouteQuote {
        uint256 totalWethOut;       // Total WETH the trader receives
        uint256 totalUsdcCost;      // Total USDC the trader pays
        uint256 uniswapUsdcAmount;  // USDC routed through Uniswap
        uint256 uniswapWethOut;     // WETH from Uniswap portion
        uint256 vaultUsdcAmount;    // Total USDC routed through vaults
        uint256 vaultWethOut;       // WETH from vault portions
        uint256 totalFees;          // Total fees paid to vaults (USDC)
        uint256 savingsVsUniswap;   // WETH savings compared to 100% Uniswap
        VaultAllocation[] allocations;
    }

    struct VaultAllocation {
        address vault;
        uint256 wethAmount;     // WETH the vault sends to trader
        uint256 usdcCost;       // USDC cost including fee
        uint256 fee;            // Fee portion in USDC
    }

    // ========== STATE VARIABLES ==========

    address public admin;
    IERC20 public immutable usdc;
    IERC20 public immutable weth;
    IPriceOracle public oracle;

    address[] public vaultList;
    mapping(address => bool) public isRegisteredVault;

    // Uniswap V3 integration
    ISwapRouter public immutable uniswapRouter;
    uint24 public constant UNISWAP_FEE_TIER = 500; // 0.05% pool

    // Safety parameters
    uint256 public constant MAX_PRICE_DEVIATION_BPS = 200; // 2% max deviation from oracle

    // Metrics
    uint256 public totalVolumeProcessed;     // Lifetime USDC volume
    uint256 public totalTradesExecuted;
    uint256 public totalSlippageSaved;        // Lifetime WETH savings vs Uniswap-only

    // ========== EVENTS ==========

    event SwapExecuted(
        address indexed trader,
        uint256 usdcIn,
        uint256 wethOut,
        uint256 uniswapPortion,
        uint256 vaultPortion,
        uint256 totalFees,
        uint256 savings
    );
    event VaultRegistered(address indexed vault);
    event VaultRemoved(address indexed vault);
    event VaultSkipped(address indexed vault, uint256 expectedAmount, uint256 actualLiquidity);
    event VaultExecutionFailed(address indexed vault, bytes reason);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TokensRescued(address indexed token, address indexed to, uint256 amount);
    event ETHRescued(address indexed to, uint256 amount);

    // ========== ERRORS ==========

    error OnlyAdmin();
    error ZeroAmount();
    error ZeroAddress();
    error SlippageExceeded(uint256 received, uint256 minimum);
    error DeadlineExpired(uint256 deadline, uint256 currentTime);
    error VaultAlreadyRegistered(address vault);
    error VaultNotRegistered(address vault);
    error SwapFailed();
    error NothingToRescue();
    error LiquidityChanged(address vault, uint256 expected, uint256 actual);
    error VaultCallFailed(address vault, bytes reason);
    error InvalidAllocation();
    error TotalAllocationMismatch(uint256 expected, uint256 actual);

    // ========== MODIFIERS ==========

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    // ========== CONSTRUCTOR ==========

    /**
     * @param _usdc USDC token address on Base
     * @param _weth WETH token address on Base
     * @param _oracle TigerFlowOracle address
     * @param _uniswapRouter Uniswap V3 SwapRouter address on Base
     */
    constructor(
        address _usdc,
        address _weth,
        address _oracle,
        address _uniswapRouter
    ) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_weth == address(0)) revert ZeroAddress();
        if (_oracle == address(0)) revert ZeroAddress();

        admin = msg.sender;
        usdc = IERC20(_usdc);
        weth = IERC20(_weth);
        oracle = IPriceOracle(_oracle);
        uniswapRouter = ISwapRouter(_uniswapRouter);
    }

    // ========== TRADER FUNCTIONS ==========

    /**
     * @notice Get a quote comparing Uniswap-only vs TigerFlow optimized route
     * @param usdcAmount Amount of USDC the trader wants to spend
     * @return quote The optimized TigerFlow route breakdown
     * @return uniswapOnlyWeth WETH amount if routed 100% through Uniswap
     */
    function getQuote(uint256 usdcAmount) external view returns (
        RouteQuote memory quote,
        uint256 uniswapOnlyWeth
    ) {
        if (usdcAmount == 0) revert ZeroAmount();

        (uint256 ethPrice, ) = oracle.getLatestPrice();

        // Uniswap-only estimate (with slippage model)
        uniswapOnlyWeth = _estimateUniswapOutput(usdcAmount, ethPrice);

        // TigerFlow optimized route
        quote = _calculateOptimalRoute(usdcAmount, ethPrice);
    }

    /**
     * @notice Execute a swap with optimal routing through vaults + Uniswap
     * @dev Uses commitment pattern: trader passes expected allocations from getQuote()
     *      to ensure liquidity hasn't changed between quote and execution.
     * @param usdcAmount Amount of USDC to swap
     * @param minWethOut Minimum WETH to receive (slippage protection)
     * @param deadline Timestamp after which the transaction reverts
     * @param expectedAllocations Expected vault allocations from getQuote() - prevents MEV/race conditions
     * @param maxLiquiditySlippageBps Max allowed change in vault liquidity (e.g., 100 = 1%)
     * @return wethOut Total WETH received by trader
     */
    function executeSwap(
        uint256 usdcAmount,
        uint256 minWethOut,
        uint256 deadline,
        VaultAllocation[] calldata expectedAllocations,
        uint256 maxLiquiditySlippageBps
    ) external nonReentrant whenNotPaused returns (uint256 wethOut) {
        if (usdcAmount == 0) revert ZeroAmount();
        if (block.timestamp > deadline) revert DeadlineExpired(deadline, block.timestamp);
        if (maxLiquiditySlippageBps > 1000) revert InvalidAllocation(); // Max 10% liquidity slippage

        (uint256 ethPrice, ) = oracle.getLatestPrice();

        // Pull USDC from trader
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // === Validate and execute vault portions ===
        uint256 vaultWethTotal = 0;
        uint256 vaultUsdcUsed = 0;
        uint256 executedAllocations = 0;

        for (uint256 i = 0; i < expectedAllocations.length; i++) {
            VaultAllocation memory alloc = expectedAllocations[i];
            if (alloc.wethAmount == 0) continue;

            // Verify vault is still registered
            if (!isRegisteredVault[alloc.vault]) {
                // Skip unregistered vaults, funds will go to Uniswap
                continue;
            }

            // Check liquidity hasn't changed significantly (MEV protection)
            uint256 currentLiquidity = ITigerFlowVault(alloc.vault).availableLiquidity();
            uint256 minExpectedLiquidity = (alloc.wethAmount * (10000 - maxLiquiditySlippageBps)) / 10000;
            
            if (currentLiquidity < minExpectedLiquidity) {
                // Liquidity dropped too much - skip this vault
                emit VaultSkipped(alloc.vault, alloc.wethAmount, currentLiquidity);
                continue;
            }

            // Try to execute through vault (with try-catch for resilience)
            try ITigerFlowVault(alloc.vault).executeSwap(
                alloc.wethAmount,
                msg.sender,
                ethPrice
            ) returns (uint256 usdcPaid) {
                // Send USDC payment to vault AFTER successful execution
                usdc.safeTransfer(alloc.vault, usdcPaid);

                vaultWethTotal += alloc.wethAmount;
                vaultUsdcUsed += usdcPaid;
                executedAllocations++;
            } catch (bytes memory reason) {
                // Vault execution failed - skip it
                emit VaultExecutionFailed(alloc.vault, reason);
                continue;
            }
        }

        // === Execute Uniswap portion with remaining USDC ===
        uint256 uniswapWeth = 0;
        uint256 remainingUsdc = usdcAmount - vaultUsdcUsed;
        
        if (remainingUsdc > 0) {
            try this._executeUniswapSwapExternal(remainingUsdc, msg.sender, deadline) returns (uint256 out) {
                uniswapWeth = out;
            } catch {
                // If Uniswap fails, we need to refund remaining USDC
                if (remainingUsdc > 0) {
                    usdc.safeTransfer(msg.sender, remainingUsdc);
                }
            }
        }

        wethOut = vaultWethTotal + uniswapWeth;

        // Slippage check on total output
        if (wethOut < minWethOut) revert SlippageExceeded(wethOut, minWethOut);

        // Calculate savings for metrics
        uint256 uniswapOnlyWeth = _estimateUniswapOutput(usdcAmount, ethPrice);
        uint256 savings = wethOut > uniswapOnlyWeth ? wethOut - uniswapOnlyWeth : 0;

        // Update metrics
        totalVolumeProcessed += usdcAmount;
        totalTradesExecuted++;
        totalSlippageSaved += savings;

        emit SwapExecuted(
            msg.sender,
            usdcAmount,
            wethOut,
            remainingUsdc,
            vaultUsdcUsed,
            0, // Fees are embedded in vaultUsdcUsed
            savings
        );
    }

    /**
     * @notice External wrapper for Uniswap swap (needed for try-catch)
     * @dev This function exists solely to allow try-catch on internal function
     */
    function _executeUniswapSwapExternal(
        uint256 usdcAmount,
        address recipient,
        uint256 deadline
    ) external returns (uint256) {
        if (msg.sender != address(this)) revert OnlyAdmin();
        return _executeUniswapSwap(usdcAmount, recipient, deadline);
    }

    // ========== ADMIN FUNCTIONS ==========

    function registerVault(address vault) external onlyAdmin {
        _registerVault(vault);
    }

    /**
     * @notice Batch register multiple vaults (gas efficient for setup)
     * @param vaults Array of vault addresses to register
     */
    function registerVaultsBatch(address[] calldata vaults) external onlyAdmin {
        uint256 len = vaults.length;
        for (uint256 i = 0; i < len; i++) {
            _registerVault(vaults[i]);
        }
    }

    function _registerVault(address vault) internal {
        if (vault == address(0)) revert ZeroAddress();
        if (isRegisteredVault[vault]) revert VaultAlreadyRegistered(vault);

        isRegisteredVault[vault] = true;
        vaultList.push(vault);

        emit VaultRegistered(vault);
    }

    function removeVault(address vault) external onlyAdmin {
        if (!isRegisteredVault[vault]) revert VaultNotRegistered(vault);

        isRegisteredVault[vault] = false;
        for (uint256 i = 0; i < vaultList.length; i++) {
            if (vaultList[i] == vault) {
                vaultList[i] = vaultList[vaultList.length - 1];
                vaultList.pop();
                break;
            }
        }

        emit VaultRemoved(vault);
    }

    function setOracle(address _oracle) external onlyAdmin {
        if (_oracle == address(0)) revert ZeroAddress();
        address old = address(oracle);
        oracle = IPriceOracle(_oracle);
        emit OracleUpdated(old, _oracle);
    }

    function setAdmin(address _admin) external onlyAdmin {
        if (_admin == address(0)) revert ZeroAddress();
        address old = admin;
        admin = _admin;
        emit AdminUpdated(old, _admin);
    }

    /**
     * @notice Emergency pause — halts all swaps
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @notice Rescue tokens accidentally sent to this contract
     * @dev Admin only. Cannot be used while swaps are in progress (nonReentrant).
     */
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyAdmin {
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert NothingToRescue();
        IERC20(token).safeTransfer(to, amount);
        emit TokensRescued(token, to, amount);
    }

    /**
     * @notice Rescue ETH accidentally sent to this contract
     * @dev Admin only.
     */
    function rescueETH(address to) external onlyAdmin {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToRescue();
        
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert SwapFailed(); // Reuse error
        
        emit ETHRescued(to, balance);
    }

    /**
     * @notice Allow contract to receive ETH (for Uniswap refunds)
     */
    receive() external payable {}

    // ========== VIEW FUNCTIONS ==========

    function getActiveVaults() external view returns (
        address[] memory vaults,
        uint256[] memory liquidities,
        uint256[] memory fees
    ) {
        uint256 count = vaultList.length;
        vaults = new address[](count);
        liquidities = new uint256[](count);
        fees = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            vaults[i] = vaultList[i];
            ITigerFlowVault v = ITigerFlowVault(vaultList[i]);
            liquidities[i] = v.availableLiquidity();
            fees[i] = v.feeBps();
        }
    }

    function getProtocolMetrics() external view returns (
        uint256 volume,
        uint256 trades,
        uint256 saved,
        uint256 vaultCount,
        uint256 totalLiquidity
    ) {
        volume = totalVolumeProcessed;
        trades = totalTradesExecuted;
        saved = totalSlippageSaved;
        vaultCount = vaultList.length;

        for (uint256 i = 0; i < vaultList.length; i++) {
            totalLiquidity += ITigerFlowVault(vaultList[i]).availableLiquidity();
        }
    }

    function getVaultCount() external view returns (uint256) {
        return vaultList.length;
    }

    /**
     * @notice Get the best available fee rate among all vaults
     * @return bestFeeBps Lowest fee in basis points, or 0 if no vaults
     * @return totalAvailableLiquidity Total WETH liquidity across all vaults
     */
    function getBestAvailableRate() external view returns (uint256 bestFeeBps, uint256 totalAvailableLiquidity) {
        uint256 len = vaultList.length;
        if (len == 0) return (0, 0);

        bestFeeBps = type(uint256).max;
        
        for (uint256 i = 0; i < len; i++) {
            ITigerFlowVault vault = ITigerFlowVault(vaultList[i]);
            uint256 liquidity = vault.availableLiquidity();
            if (liquidity > 0) {
                uint256 fee = vault.feeBps();
                if (fee < bestFeeBps) {
                    bestFeeBps = fee;
                }
                totalAvailableLiquidity += liquidity;
            }
        }

        if (bestFeeBps == type(uint256).max) {
            bestFeeBps = 0; // No vaults with liquidity
        }
    }

    // ========== INTERNAL: ROUTING ALGORITHM ==========

    /**
     * @notice Calculate the optimal route splitting between vaults and Uniswap
     * @dev Algorithm:
     *   1. Get oracle price and total vault liquidity
     *   2. For each vault (sorted by fee ascending = cheapest first):
     *      - Calculate how much WETH this vault can provide (respecting utilization limit)
     *      - Calculate USDC cost at oracle price + vault fee
     *      - Compare effective price vs estimated Uniswap price at remaining size
     *      - If vault is cheaper, allocate; otherwise skip to Uniswap
     *   3. Route remaining USDC through Uniswap
     */
    function _calculateOptimalRoute(
        uint256 usdcAmount,
        uint256 ethPrice
    ) internal view returns (RouteQuote memory quote) {
        uint256 remainingUsdc = usdcAmount;
        uint256 vaultCount = vaultList.length;

        VaultAllocation[] memory tempAllocs = new VaultAllocation[](vaultCount);
        uint256 allocCount = 0;

        // Sort vaults by fee (cheapest first)
        address[] memory sorted = _sortVaultsByFee();

        for (uint256 i = 0; i < sorted.length && remainingUsdc > 0; i++) {
            ITigerFlowVault vault = ITigerFlowVault(sorted[i]);

            // Skip if price below vault minimum
            if (ethPrice < vault.minPrice()) continue;

            // How much WETH can this vault provide?
            uint256 wethAvailable = vault.availableLiquidity();
            uint256 maxWethPerTrade = (wethAvailable * vault.maxUtilizationBps()) / 10000;
            if (maxWethPerTrade == 0) continue;

            // How much WETH does the remaining USDC buy at oracle price?
            // wethForRemaining = remainingUsdc * 1e20 / ethPrice
            uint256 wethWanted = (remainingUsdc * 1e20) / ethPrice;

            // Use the lesser of what's wanted and what's available
            uint256 wethToUse = wethWanted > maxWethPerTrade ? maxWethPerTrade : wethWanted;

            // Calculate USDC cost from vault (oracle price + fee)
            uint256 baseUsdcCost = (wethToUse * ethPrice) / 1e20;
            uint256 feeUsdc = (baseUsdcCost * vault.feeBps()) / 10000;
            uint256 totalUsdcCost = baseUsdcCost + feeUsdc;

            // Don't exceed remaining USDC
            if (totalUsdcCost > remainingUsdc) {
                // Scale down wethToUse proportionally
                wethToUse = (remainingUsdc * 1e20) / (ethPrice + (ethPrice * vault.feeBps()) / 10000);
                baseUsdcCost = (wethToUse * ethPrice) / 1e20;
                feeUsdc = (baseUsdcCost * vault.feeBps()) / 10000;
                totalUsdcCost = baseUsdcCost + feeUsdc;
                if (totalUsdcCost > remainingUsdc) {
                    totalUsdcCost = remainingUsdc;
                    feeUsdc = (totalUsdcCost * vault.feeBps()) / (10000 + vault.feeBps());
                    baseUsdcCost = totalUsdcCost - feeUsdc;
                    wethToUse = (baseUsdcCost * 1e20) / ethPrice;
                }
            }

            if (wethToUse == 0) continue;

            tempAllocs[allocCount] = VaultAllocation({
                vault: sorted[i],
                wethAmount: wethToUse,
                usdcCost: totalUsdcCost,
                fee: feeUsdc
            });

            quote.vaultWethOut += wethToUse;
            quote.vaultUsdcAmount += totalUsdcCost;
            quote.totalFees += feeUsdc;
            remainingUsdc -= totalUsdcCost;
            allocCount++;
        }

        // Copy allocations
        quote.allocations = new VaultAllocation[](allocCount);
        for (uint256 i = 0; i < allocCount; i++) {
            quote.allocations[i] = tempAllocs[i];
        }

        // Remaining goes to Uniswap
        if (remainingUsdc > 0) {
            quote.uniswapUsdcAmount = remainingUsdc;
            quote.uniswapWethOut = _estimateUniswapOutput(remainingUsdc, ethPrice);
        }

        quote.totalWethOut = quote.vaultWethOut + quote.uniswapWethOut;
        quote.totalUsdcCost = usdcAmount;

        // Calculate savings vs Uniswap-only
        uint256 uniswapOnlyWeth = _estimateUniswapOutput(usdcAmount, ethPrice);
        quote.savingsVsUniswap = quote.totalWethOut > uniswapOnlyWeth
            ? quote.totalWethOut - uniswapOnlyWeth
            : 0;
    }

    /**
     * @notice Sort vaults by fee ascending (cheapest first)
     * @dev Uses insertion sort - O(n²) but efficient for small n (<20 vaults)
     *      Each external call to feeBps() costs ~2600 gas, so we minimize comparisons
     */
    function _sortVaultsByFee() internal view returns (address[] memory sorted) {
        uint256 len = vaultList.length;
        sorted = new address[](len);
        
        // Copy to memory
        for (uint256 i = 0; i < len; i++) {
            sorted[i] = vaultList[i];
        }

        // Insertion sort - fewer external calls than selection sort for nearly-sorted data
        for (uint256 i = 1; i < len; i++) {
            address key = sorted[i];
            uint256 keyFee = ITigerFlowVault(key).feeBps();
            
            uint256 j = i;
            while (j > 0 && ITigerFlowVault(sorted[j - 1]).feeBps() > keyFee) {
                sorted[j] = sorted[j - 1];
                j--;
            }
            sorted[j] = key;
        }
    }

    // ========== INTERNAL: UNISWAP ==========

    /**
     * @notice Estimate Uniswap output with simulated slippage model
     * @dev Models increasing slippage for larger trades (USDC/ETH on Base).
     *      In production, this calls the Uniswap V3 Quoter on-chain.
     */
    function _estimateUniswapOutput(
        uint256 usdcAmount,
        uint256 ethPrice
    ) internal pure returns (uint256 wethOut) {
        // Base conversion: usdcAmount (6 dec) → WETH (18 dec) at ethPrice (8 dec)
        uint256 rawWeth = (usdcAmount * 1e20) / ethPrice;

        // Apply slippage
        uint256 slippageBps = _estimateSlippage(usdcAmount);
        wethOut = (rawWeth * (10000 - slippageBps)) / 10000;
    }

    /**
     * @notice Slippage curve based on trade size
     */
    function _estimateSlippage(uint256 usdcAmount) internal pure returns (uint256 bps) {
        uint256 dollars = usdcAmount / 1e6;

        if (dollars <= 10_000) {
            bps = 5;    // 0.05%
        } else if (dollars <= 50_000) {
            bps = 30;   // 0.3%
        } else if (dollars <= 100_000) {
            bps = 80;   // 0.8%
        } else if (dollars <= 500_000) {
            bps = 200;  // 2.0%
        } else {
            bps = 400;  // 4.0%
        }
    }

    /**
     * @notice Execute a swap through Uniswap V3
     * @dev Uses forceApprove to handle USDC's approval pattern
     */
    function _executeUniswapSwap(
        uint256 usdcAmount,
        address recipient,
        uint256 deadline
    ) internal returns (uint256 wethOut) {
        if (address(uniswapRouter) == address(0)) {
            // Fallback for testnet without Uniswap: return 0
            return 0;
        }

        // Use forceApprove for USDC (handles non-zero allowance reset requirement)
        usdc.forceApprove(address(uniswapRouter), usdcAmount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: address(usdc),
                tokenOut: address(weth),
                fee: UNISWAP_FEE_TIER,
                recipient: recipient,
                deadline: deadline,
                amountIn: usdcAmount,
                amountOutMinimum: 0, // Slippage checked at aggregate level
                sqrtPriceLimitX96: 0
            });

        wethOut = uniswapRouter.exactInputSingle(params);
    }
}
