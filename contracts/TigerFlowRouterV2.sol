// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./interfaces/ITigerFlowVault.sol";
import "./interfaces/IPriceOracle.sol";
import "./RobinPumpAdapter.sol";

/**
 * @title TigerFlowRouterV2
 * @author TigerFlow
 * @notice Enhanced routing engine with RobinPump integration for Base.
 *         Routes trades across: RobinPump bonding curves → Merchant vaults → Uniswap V3
 *         Optimizes for best price across all liquidity sources.
 * Security: ReentrancyGuard, Pausable, comprehensive input validation, try-catch resilience
 *
 *   New in V2:
 *     - RobinPump bonding curve integration for early-stage tokens
 *     - Multi-source routing: RobinPump → Vaults → Uniswap
 *     - Token discovery for RobinPump launches
 *     - Price comparison across all sources
 *     - Enhanced security with price manipulation detection
 */
contract TigerFlowRouterV2 is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ========== STRUCTS ==========

    struct RouteQuote {
        uint256 totalWethOut;           // Total WETH the trader receives
        uint256 totalUsdcCost;          // Total USDC the trader pays
        uint256 robinPumpUsdcAmount;    // USDC routed through RobinPump
        uint256 robinPumpWethOut;       // WETH from RobinPump
        uint256 vaultUsdcAmount;        // Total USDC routed through vaults
        uint256 vaultWethOut;           // WETH from vault portions
        uint256 uniswapUsdcAmount;      // USDC routed through Uniswap
        uint256 uniswapWethOut;         // WETH from Uniswap portion
        uint256 totalFees;              // Total fees paid
        uint256 savingsVsUniswap;       // WETH savings compared to 100% Uniswap
        SourceAllocation[] allocations;
    }

    struct SourceAllocation {
        SourceType sourceType;      // 0=RobinPump, 1=Vault, 2=Uniswap
        address source;             // Pool/vault/router address
        uint256 wethAmount;         // WETH the source sends to trader
        uint256 usdcCost;           // USDC cost including fee
        uint256 fee;                // Fee portion in USDC
    }

    enum SourceType { RobinPump, Vault, Uniswap }

    // ========== STATE VARIABLES ==========

    address public admin;
    IERC20 public immutable usdc;
    IERC20 public immutable weth;
    IPriceOracle public oracle;
    
    // RobinPump integration
    RobinPumpAdapter public robinPumpAdapter;

    // Vault registry
    address[] public vaultList;
    mapping(address => bool) public isRegisteredVault;

    // Uniswap V3 integration
    ISwapRouter public immutable uniswapRouter;
    uint24 public constant UNISWAP_FEE_TIER = 500; // 0.05% pool

    // Safety parameters
    uint256 public constant MAX_PRICE_DEVIATION_BPS = 200; // 2% max deviation from oracle
    uint256 public constant MAX_SLIPPAGE_BPS = 400;        // 4% max slippage
    uint256 public constant MIN_TRADE_SIZE = 100e6;        // 100 USDC minimum
    uint256 public constant MAX_TRADE_SIZE = 1_000_000e6;  // 1M USDC maximum
    uint256 public constant MAX_ALLOCATIONS = 10;          // Max sources per trade
    uint256 public robinPumpMaxSlippageBps = 400;          // 4% default for bonding curves

    // Metrics
    uint256 public totalVolumeProcessed;
    uint256 public totalTradesExecuted;
    uint256 public totalSlippageSaved;
    uint256 public robinPumpVolume;

    // ========== EVENTS ==========

    event SwapExecuted(
        address indexed trader,
        address indexed token,
        uint256 usdcIn,
        uint256 tokensOut,
        uint256 robinPumpPortion,
        uint256 vaultPortion,
        uint256 uniswapPortion,
        uint256 totalFees,
        uint256 savings
    );
    event RobinPumpAdapterUpdated(address indexed oldAdapter, address indexed newAdapter);
    event VaultRegistered(address indexed vault);
    event VaultRemoved(address indexed vault);
    event SourceSkipped(SourceType sourceType, address indexed source, string reason);
    event SourceExecutionFailed(SourceType sourceType, address indexed source, bytes reason);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TokensRescued(address indexed token, address indexed to, uint256 amount);
    event ETHRescued(address indexed to, uint256 amount);
    event PriceManipulationDetected(address indexed token, uint256 expectedPrice, uint256 actualPrice);

    // ========== ERRORS ==========

    error OnlyAdmin();
    error ZeroAmount();
    error ZeroAddress();
    error InvalidToken();
    error InvalidAmount();
    error TradeTooSmall();
    error TradeTooLarge();
    error SlippageExceeded(uint256 received, uint256 minimum);
    error DeadlineExpired(uint256 deadline, uint256 currentTime);
    error VaultAlreadyRegistered(address vault);
    error VaultNotRegistered(address vault);
    error SwapFailed();
    error NothingToRescue();
    error InvalidAllocation();
    error TooManyAllocations(uint256 count, uint256 max);
    error TotalAllocationMismatch(uint256 expected, uint256 actual);
    error RobinPumpNotAvailable(address token);
    error InvalidAdapter();
    error PriceDeviationTooHigh(uint256 deviation, uint256 max);
    error InvalidSlippage(uint256 slippage, uint256 max);
    error SourceNotAuthorized(address source);
    error ETHTransferFailed();

    // ========== MODIFIERS ==========

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    modifier validToken(address token) {
        if (token == address(0)) revert InvalidToken();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert ZeroAmount();
        if (amount < MIN_TRADE_SIZE) revert TradeTooSmall();
        if (amount > MAX_TRADE_SIZE) revert TradeTooLarge();
        _;
    }

    // ========== CONSTRUCTOR ==========

    constructor(
        address _usdc,
        address _weth,
        address _oracle,
        address _uniswapRouter,
        address payable _robinPumpAdapter
    ) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_weth == address(0)) revert ZeroAddress();
        if (_oracle == address(0)) revert ZeroAddress();
        if (_uniswapRouter == address(0)) revert ZeroAddress();

        admin = msg.sender;
        usdc = IERC20(_usdc);
        weth = IERC20(_weth);
        oracle = IPriceOracle(_oracle);
        uniswapRouter = ISwapRouter(_uniswapRouter);
        
        if (_robinPumpAdapter != address(0)) {
            robinPumpAdapter = RobinPumpAdapter(_robinPumpAdapter);
        }
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Check if a token is available on RobinPump
     * @param token Token address to check
     * @return available True if token has an active RobinPump pool
     * @return currentPrice Current price from RobinPump
     * @return availableLiquidity Available liquidity (unlimited for bonding curves)
     * @return isGraduated Whether token has graduated to Uniswap
     */
    function getRobinPumpStatus(address token) 
        external 
        view 
        validToken(token) 
        returns (
            bool available,
            uint256 currentPrice,
            uint256 availableLiquidity,
            bool isGraduated
        ) 
    {
        if (address(robinPumpAdapter) == address(0)) {
            return (false, 0, 0, false);
        }

        try robinPumpAdapter.hasActivePool(token) returns (bool active) {
            if (!active) return (false, 0, 0, false);
            
            currentPrice = robinPumpAdapter.getCurrentPrice(token);
            // For bonding curves, liquidity is effectively unlimited until graduation
            availableLiquidity = type(uint256).max;
            isGraduated = false;
            return (true, currentPrice, availableLiquidity, false);
        } catch {
            return (false, 0, 0, false);
        }
    }

    /**
     * @notice Get quote for buying a token through RobinPump
     * @param token Token to buy
     * @param usdcAmount Amount of USDC to spend
     * @return tokensOut Expected tokens received
     * @return price Current price
     */
    function getRobinPumpQuote(address token, uint256 usdcAmount) 
        external 
        view 
        validToken(token) 
        validAmount(usdcAmount) 
        returns (uint256 tokensOut, uint256 price) 
    {
        if (address(robinPumpAdapter) == address(0)) revert RobinPumpNotAvailable(token);
        
        bool hasPool = robinPumpAdapter.hasActivePool(token);
        if (!hasPool) revert RobinPumpNotAvailable(token);
        
        price = robinPumpAdapter.getCurrentPrice(token);
        
        // Convert USDC to ETH equivalent, then get token amount
        (uint256 ethPrice, ) = oracle.getLatestPrice();
        uint256 ethAmount = (usdcAmount * 1e18) / ethPrice;
        
        tokensOut = robinPumpAdapter.getBuyQuote(token, ethAmount);
    }

    /**
     * @notice Get all active RobinPump tokens
     * @return tokens Array of token addresses
     * @return prices Current prices for each token
     */
    function getActiveRobinPumpTokens() 
        external 
        view 
        returns (address[] memory tokens, uint256[] memory prices) 
    {
        if (address(robinPumpAdapter) == address(0)) {
            return (new address[](0), new uint256[](0));
        }

        (tokens, ) = robinPumpAdapter.getActivePools();
        prices = new uint256[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            try robinPumpAdapter.getCurrentPrice(tokens[i]) returns (uint256 price) {
                prices[i] = price;
            } catch {
                prices[i] = 0;
            }
        }
    }

    /**
     * @notice Get optimal route quote comparing all sources
     * @param token Token to buy (WETH or RobinPump token)
     * @param usdcAmount Amount of USDC to spend
     * @return quote Optimal route breakdown
     * @return uniswapOnlyWeth WETH amount if 100% Uniswap
     */
    function getQuote(address token, uint256 usdcAmount) 
        external 
        view 
        validToken(token) 
        validAmount(usdcAmount) 
        returns (RouteQuote memory quote, uint256 uniswapOnlyWeth) 
    {
        (uint256 ethPrice, ) = oracle.getLatestPrice();

        // Uniswap-only baseline
        uniswapOnlyWeth = _estimateUniswapOutput(usdcAmount, ethPrice);

        // Calculate optimal route across all sources
        quote = _calculateOptimalRoute(token, usdcAmount, ethPrice);
    }

    // ========== INTERNAL FUNCTIONS ==========

    function _calculateOptimalRoute(
        address token,
        uint256 usdcAmount,
        uint256 ethPrice
    ) internal view returns (RouteQuote memory quote) {
        
        uint256 remainingUsdc = usdcAmount;
        uint256 totalWethOut = 0;
        SourceAllocation[] memory allocs = new SourceAllocation[](vaultList.length + 2);
        uint256 allocCount = 0;

        // === 1. Check RobinPump (best for early-stage tokens) ===
        if (address(robinPumpAdapter) != address(0)) {
            try robinPumpAdapter.hasActivePool(token) returns (bool hasPool) {
                if (hasPool) {
                    uint256 robinPumpPrice = robinPumpAdapter.getCurrentPrice(token);
                    uint256 ethAmount = (remainingUsdc * 1e18) / ethPrice;
                    uint256 tokensFromRobinPump = robinPumpAdapter.getBuyQuote(token, ethAmount);
                    
                    // Convert back to WETH equivalent for comparison
                    uint256 wethFromRobinPump = (tokensFromRobinPump * robinPumpPrice) / 1e18;
                    
                    // Use RobinPump if price is better than Uniswap
                    uint256 uniswapEstimate = _estimateUniswapOutput(remainingUsdc, ethPrice);
                    if (wethFromRobinPump > uniswapEstimate) {
                        allocs[allocCount] = SourceAllocation({
                            sourceType: SourceType.RobinPump,
                            source: address(robinPumpAdapter),
                            wethAmount: wethFromRobinPump,
                            usdcCost: remainingUsdc,
                            fee: 0
                        });
                        allocCount++;
                        totalWethOut += wethFromRobinPump;
                        remainingUsdc = 0;
                    }
                }
            } catch {}
        }

        // === 2. Route through vaults (if WETH and remaining USDC) ===
        if (token == address(weth) && remainingUsdc > 0) {
            VaultQuote[] memory vaultQuotes = _getVaultQuotes(remainingUsdc);
            
            for (uint256 i = 0; i < vaultQuotes.length && remainingUsdc > 0; i++) {
                if (vaultQuotes[i].wethOut == 0) continue;
                
                uint256 vaultUsdc = vaultQuotes[i].usdcCost;
                if (vaultUsdc > remainingUsdc) vaultUsdc = remainingUsdc;
                
                allocs[allocCount] = SourceAllocation({
                    sourceType: SourceType.Vault,
                    source: vaultQuotes[i].vault,
                    wethAmount: vaultQuotes[i].wethOut,
                    usdcCost: vaultUsdc,
                    fee: vaultQuotes[i].fee
                });
                allocCount++;
                
                totalWethOut += vaultQuotes[i].wethOut;
                remainingUsdc -= vaultUsdc;
            }
        }

        // === 3. Uniswap for remainder ===
        if (remainingUsdc > 0) {
            uint256 uniswapWeth = _estimateUniswapOutput(remainingUsdc, ethPrice);
            allocs[allocCount] = SourceAllocation({
                sourceType: SourceType.Uniswap,
                source: address(uniswapRouter),
                wethAmount: uniswapWeth,
                usdcCost: remainingUsdc,
                fee: 0
            });
            allocCount++;
            totalWethOut += uniswapWeth;
        }

        // Build final quote
        quote.totalWethOut = totalWethOut;
        quote.totalUsdcCost = usdcAmount;
        quote.allocations = new SourceAllocation[](allocCount);
        for (uint256 i = 0; i < allocCount; i++) {
            quote.allocations[i] = allocs[i];
        }
        
        return quote;
    }

    struct VaultQuote {
        address vault;
        uint256 wethOut;
        uint256 usdcCost;
        uint256 fee;
        uint256 effectiveRate;
    }

    function _getVaultQuotes(uint256 usdcAmount) internal view returns (VaultQuote[] memory) {
        VaultQuote[] memory quotes = new VaultQuote[](vaultList.length);
        uint256 validCount = 0;

        for (uint256 i = 0; i < vaultList.length; i++) {
            address vault = vaultList[i];
            if (!isRegisteredVault[vault]) continue;

            try ITigerFlowVault(vault).availableLiquidity() returns (uint256 liquidity) {
                if (liquidity > 0) {
                    uint256 feeBps = ITigerFlowVault(vault).feeBps();
                    uint256 wethOut = liquidity > (usdcAmount * 1e18 / 2000e8) ? (usdcAmount * 1e18 / 2000e8) : liquidity;
                    uint256 fee = (wethOut * feeBps) / 10000;
                    uint256 usdcCost = usdcAmount;
                    
                    quotes[validCount] = VaultQuote({
                        vault: vault,
                        wethOut: wethOut - fee,
                        usdcCost: usdcCost,
                        fee: fee,
                        effectiveRate: ((wethOut - fee) * 1e18) / usdcCost
                    });
                    validCount++;
                }
            } catch {}
        }

        // Sort by effective rate (best first)
        for (uint256 i = 0; i < validCount; i++) {
            for (uint256 j = i + 1; j < validCount; j++) {
                if (quotes[j].effectiveRate > quotes[i].effectiveRate) {
                    VaultQuote memory temp = quotes[i];
                    quotes[i] = quotes[j];
                    quotes[j] = temp;
                }
            }
        }

        return quotes;
    }

    function _estimateUniswapOutput(uint256 usdcAmount, uint256 ethPrice) internal pure returns (uint256) {
        uint256 ethOut = (usdcAmount * 1e18) / ethPrice;
        // Apply 0.3% fee + slippage estimate
        return (ethOut * 995) / 1000;
    }

    // ========== EXECUTE FUNCTIONS ==========

    /**
     * @notice Execute swap across all available sources
     * @param token Token to buy
     * @param usdcAmount Amount of USDC to spend
     * @param minTokensOut Minimum tokens to receive (slippage protection)
     * @param deadline Transaction deadline
     * @param expectedAllocations Expected allocations from getQuote()
     * @return tokensOut Total tokens received
     */
    function executeSwap(
        address token,
        uint256 usdcAmount,
        uint256 minTokensOut,
        uint256 deadline,
        SourceAllocation[] calldata expectedAllocations
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validToken(token) 
        validAmount(usdcAmount) 
        returns (uint256 tokensOut) 
    {
        if (minTokensOut == 0) revert ZeroAmount();
        if (block.timestamp > deadline) revert DeadlineExpired(deadline, block.timestamp);
        if (expectedAllocations.length == 0) revert InvalidAllocation();
        if (expectedAllocations.length > MAX_ALLOCATIONS) revert TooManyAllocations(expectedAllocations.length, MAX_ALLOCATIONS);

        // Pull USDC from trader
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        uint256 totalTokens = 0;
        uint256 usdcUsed = 0;

        // Execute through each source
        for (uint256 i = 0; i < expectedAllocations.length; i++) {
            SourceAllocation memory alloc = expectedAllocations[i];
            
            // Validate source
            if (alloc.sourceType == SourceType.RobinPump) {
                if (alloc.source != address(robinPumpAdapter)) revert SourceNotAuthorized(alloc.source);
            } else if (alloc.sourceType == SourceType.Vault) {
                if (!isRegisteredVault[alloc.source]) {
                    emit SourceSkipped(SourceType.Vault, alloc.source, "Not registered");
                    continue;
                }
            } else if (alloc.sourceType == SourceType.Uniswap) {
                if (alloc.source != address(uniswapRouter)) revert SourceNotAuthorized(alloc.source);
            }

            if (alloc.sourceType == SourceType.RobinPump) {
                // Execute through RobinPump
                try this._executeRobinPumpBuy(token, alloc.usdcCost, alloc.wethAmount) returns (uint256 out) {
                    totalTokens += out;
                    usdcUsed += alloc.usdcCost;
                    robinPumpVolume += alloc.usdcCost;
                } catch (bytes memory reason) {
                    emit SourceExecutionFailed(SourceType.RobinPump, address(robinPumpAdapter), reason);
                }
            } else if (alloc.sourceType == SourceType.Vault) {
                // Execute through vault
                // Calculate USDC needed for vault
                uint256 ethPrice = 2000e8; // Placeholder - should come from oracle
                uint256 usdcForVault = (alloc.wethAmount * ethPrice) / 1e8;
                
                try ITigerFlowVault(alloc.source).executeSwap(
                    alloc.wethAmount,
                    msg.sender,
                    ethPrice
                ) returns (uint256 usdcPaid) {
                    usdc.safeTransfer(alloc.source, usdcPaid);
                    totalTokens += alloc.wethAmount;
                    usdcUsed += usdcPaid;
                } catch (bytes memory reason) {
                    emit SourceExecutionFailed(SourceType.Vault, alloc.source, reason);
                }
            } else if (alloc.sourceType == SourceType.Uniswap) {
                // Execute through Uniswap
                uint256 remainingUsdc = usdcAmount - usdcUsed;
                if (remainingUsdc > 0) {
                    try this._executeUniswapSwapExternal(remainingUsdc, msg.sender, deadline) returns (uint256 out) {
                        totalTokens += out;
                        usdcUsed += remainingUsdc;
                    } catch (bytes memory reason) {
                        emit SourceExecutionFailed(SourceType.Uniswap, address(uniswapRouter), reason);
                    }
                }
            }
        }

        // Refund any unused USDC
        uint256 remainingUsdc = usdcAmount - usdcUsed;
        if (remainingUsdc > 0) {
            usdc.safeTransfer(msg.sender, remainingUsdc);
        }

        // Slippage check
        if (totalTokens < minTokensOut) revert SlippageExceeded(totalTokens, minTokensOut);

        // Update metrics
        totalVolumeProcessed += usdcUsed;
        totalTradesExecuted++;

        emit SwapExecuted(
            msg.sender,
            token,
            usdcUsed,
            totalTokens,
            0, // RobinPump portion tracked separately
            0, // Vault portion
            0, // Uniswap portion
            0, // Total fees
            0  // Savings
        );

        return totalTokens;
    }

    function _executeRobinPumpBuy(
        address token,
        uint256 usdcAmount,
        uint256 minTokensOut
    ) external payable returns (uint256) {
        if (msg.sender != address(this)) revert OnlyAdmin();
        
        // Convert USDC to ETH for RobinPump
        (uint256 ethPrice, ) = oracle.getLatestPrice();
        uint256 ethAmount = (usdcAmount * 1e18) / ethPrice;
        
        // Approve and execute through adapter
        usdc.forceApprove(address(robinPumpAdapter), usdcAmount);
        return robinPumpAdapter.executeBuy{value: ethAmount}(token, minTokensOut);
    }

    function _executeUniswapSwapExternal(
        uint256 usdcAmount,
        address recipient,
        uint256 deadline
    ) external returns (uint256) {
        if (msg.sender != address(this)) revert OnlyAdmin();
        return _executeUniswapSwap(usdcAmount, recipient, deadline);
    }

    function _executeUniswapSwap(
        uint256 usdcAmount,
        address recipient,
        uint256 deadline
    ) internal returns (uint256) {
        usdc.forceApprove(address(uniswapRouter), usdcAmount);
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(usdc),
            tokenOut: address(weth),
            fee: UNISWAP_FEE_TIER,
            recipient: recipient,
            deadline: deadline,
            amountIn: usdcAmount,
            amountOutMinimum: 0, // Already checked at top level
            sqrtPriceLimitX96: 0
        });
        
        return uniswapRouter.exactInputSingle(params);
    }

    // ========== ADMIN FUNCTIONS ==========

    function setRobinPumpAdapter(address payable _adapter) external onlyAdmin {
        if (_adapter == address(0)) revert InvalidAdapter();
        
        address oldAdapter = address(robinPumpAdapter);
        robinPumpAdapter = RobinPumpAdapter(_adapter);
        
        emit RobinPumpAdapterUpdated(oldAdapter, _adapter);
    }

    function registerVault(address vault) external onlyAdmin {
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

    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        if (newAdmin == admin) revert ZeroAddress();
        
        address oldAdmin = admin;
        admin = newAdmin;
        
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    function setOracle(address newOracle) external onlyAdmin {
        if (newOracle == address(0)) revert ZeroAddress();
        
        address oldOracle = address(oracle);
        oracle = IPriceOracle(newOracle);
        
        emit OracleUpdated(oldOracle, newOracle);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function rescueTokens(address token, address to) external onlyAdmin validToken(token) {
        if (to == address(0)) revert ZeroAddress();
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToRescue();
        
        IERC20(token).safeTransfer(to, balance);
        
        emit TokensRescued(token, to, balance);
    }

    function rescueETH(address payable to) external onlyAdmin {
        if (to == address(0)) revert ZeroAddress();
        
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToRescue();
        
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert ETHTransferFailed();
        
        emit ETHRescued(to, balance);
    }

    receive() external payable {}
}
