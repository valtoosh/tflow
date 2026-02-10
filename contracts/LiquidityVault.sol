// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ITigerFlowVault.sol";

/**
 * @title LiquidityVault
 * @author TigerFlow
 * @notice Non-custodial merchant WETH vault for large trade execution on Base.
 *
 *   Economic model:
 *   - Merchants deposit idle WETH into this vault and set execution rules
 *   - When a trader makes a large USDC→ETH swap, the router routes part of
 *     the trade through this vault instead of Uniswap
 *   - The vault sends WETH to the trader at oracle price (better than Uniswap
 *     slippage on large trades)
 *   - The vault receives USDC as payment and earns a fee
 *   - Merchant accumulates USDC and earns yield on their previously idle WETH
 *
 *   Security: ReentrancyGuard, Pausable, CEI pattern, access control, deposit caps,
 *   input validation, custom errors.
 */
contract LiquidityVault is ITigerFlowVault, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ========== STATE VARIABLES ==========

    address public override owner;
    address public immutable router;
    IERC20 public immutable weth;
    IERC20 public immutable usdc;

    uint256 public override feeBps;            // Fee in basis points (e.g., 15 = 0.15%)
    uint256 public override minPrice;          // Min ETH price in USD (8 decimals) vault will sell at
    uint256 public override maxUtilizationBps; // Max % of vault usable per trade (bps)

    uint256 public totalDeposited;         // Lifetime WETH deposited
    uint256 public totalFeesEarned;        // Lifetime USDC fees earned
    uint256 public totalVolumeRouted;      // Lifetime USDC volume routed
    uint256 public totalWethSold;          // Lifetime WETH sold via swaps
    uint256 public tradeCount;

    uint256 public constant MAX_DEPOSIT_CAP = 200 ether;      // 200 WETH max per vault for demo
    uint256 public constant MIN_FEE_BPS = 1;                   // 0.01% minimum
    uint256 public constant MAX_FEE_BPS = 100;                 // 1% maximum
    uint256 public constant MAX_UTIL_BPS = 5000;               // 50% max utilization per trade

    // ========== EVENTS ==========

    event Deposited(address indexed depositor, uint256 wethAmount, uint256 newBalance);
    event Withdrawn(address indexed to, address indexed token, uint256 amount);
    event SwapExecuted(
        address indexed trader,
        uint256 wethOut,
        uint256 usdcIn,
        uint256 feeUsdc,
        uint256 ethPrice
    );
    event ParametersUpdated(uint256 newFeeBps, uint256 newMinPrice, uint256 newMaxUtilBps);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);
    event ETHRescued(address indexed to, uint256 amount);

    // ========== ERRORS ==========

    error OnlyOwner();
    error OnlyRouter();
    error ZeroAmount();
    error DepositCapExceeded(uint256 attempted, uint256 cap);
    error InsufficientWethBalance(uint256 requested, uint256 available);
    error PriceBelowMinimum(uint256 currentPrice, uint256 minAllowed);
    error UtilizationExceeded(uint256 requested, uint256 maxAllowed);
    error InvalidFee(uint256 fee);
    error InvalidUtilization(uint256 util);
    error ZeroAddress();
    error UsdcPaymentNotReceived(uint256 expected, uint256 received);
    error InsufficientBalance(uint256 requested, uint256 available);
    error ETHTransferFailed();

    // ========== MODIFIERS ==========

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyRouter() {
        if (msg.sender != router) revert OnlyRouter();
        _;
    }

    // ========== CONSTRUCTOR ==========

    /**
     * @param _weth WETH token address on Base
     * @param _usdc USDC token address on Base
     * @param _router TigerFlow router address
     * @param _owner The merchant who owns this vault
     * @param _feeBps Fee percentage in basis points
     * @param _minPrice Minimum ETH price the vault will sell at (8 decimals)
     * @param _maxUtilizationBps Maximum % of vault usable per trade
     */
    constructor(
        address _weth,
        address _usdc,
        address _router,
        address _owner,
        uint256 _feeBps,
        uint256 _minPrice,
        uint256 _maxUtilizationBps
    ) {
        if (_weth == address(0)) revert ZeroAddress();
        if (_usdc == address(0)) revert ZeroAddress();
        if (_router == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();
        if (_feeBps < MIN_FEE_BPS || _feeBps > MAX_FEE_BPS) revert InvalidFee(_feeBps);
        if (_maxUtilizationBps == 0 || _maxUtilizationBps > MAX_UTIL_BPS) {
            revert InvalidUtilization(_maxUtilizationBps);
        }

        weth = IERC20(_weth);
        usdc = IERC20(_usdc);
        router = _router;
        owner = _owner;
        feeBps = _feeBps;
        minPrice = _minPrice;
        maxUtilizationBps = _maxUtilizationBps;
    }

    // ========== MERCHANT FUNCTIONS ==========

    /**
     * @notice Deposit WETH into the vault
     * @param amount Amount of WETH to deposit (18 decimals)
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();

        uint256 newBalance = weth.balanceOf(address(this)) + amount;
        if (newBalance > MAX_DEPOSIT_CAP) {
            revert DepositCapExceeded(newBalance, MAX_DEPOSIT_CAP);
        }

        // Effects
        totalDeposited += amount;

        // Interactions (CEI)
        weth.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, newBalance);
    }

    /**
     * @notice Withdraw WETH from the vault (owner only, anytime — even when paused)
     * @param amount Amount of WETH to withdraw
     */
    function withdrawWeth(uint256 amount) external nonReentrant onlyOwner {
        if (amount == 0) revert ZeroAmount();

        uint256 balance = weth.balanceOf(address(this));
        if (amount > balance) revert InsufficientWethBalance(amount, balance);

        // Interactions
        weth.safeTransfer(owner, amount);

        emit Withdrawn(owner, address(weth), amount);
    }

    /**
     * @notice Withdraw accumulated USDC from vault fees & swap payments (owner only)
     * @param amount Amount of USDC to withdraw
     */
    function withdrawUsdc(uint256 amount) external nonReentrant onlyOwner {
        if (amount == 0) revert ZeroAmount();

        uint256 balance = usdc.balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance(amount, balance);

        // Interactions
        usdc.safeTransfer(owner, amount);

        emit Withdrawn(owner, address(usdc), amount);
    }

    /**
     * @notice Rescue ETH accidentally sent to this vault
     * @param to Address to send ETH to
     */
    function rescueETH(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        if (balance == 0) revert ZeroAmount();
        
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert ETHTransferFailed();
        
        emit ETHRescued(to, balance);
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}

    /**
     * @notice Update vault parameters (owner only)
     */
    function updateParameters(
        uint256 _feeBps,
        uint256 _minPrice,
        uint256 _maxUtilizationBps
    ) external onlyOwner {
        if (_feeBps < MIN_FEE_BPS || _feeBps > MAX_FEE_BPS) revert InvalidFee(_feeBps);
        if (_maxUtilizationBps == 0 || _maxUtilizationBps > MAX_UTIL_BPS) {
            revert InvalidUtilization(_maxUtilizationBps);
        }

        feeBps = _feeBps;
        minPrice = _minPrice;
        maxUtilizationBps = _maxUtilizationBps;

        emit ParametersUpdated(_feeBps, _minPrice, _maxUtilizationBps);
    }

    // Router is immutable for security - prevents owner from stealing funds by changing router

    /**
     * @notice Emergency pause — halts deposits and swaps (owner only)
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    /**
     * @notice Unpause (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    // ========== ROUTER FUNCTIONS ==========

    /**
     * @notice Execute a swap: send WETH to trader, expect USDC payment from router
     * @dev Called ONLY by the router during trade execution.
     *   Flow:
     *     1. Router calls this function with the WETH amount to sell
     *     2. Vault validates price, utilization, and calculates USDC required
     *     3. Vault transfers WETH to the trader
     *     4. Returns usdcRequired — router MUST transfer this USDC to vault afterwards
     *
     * @param wethAmount Amount of WETH to send to the trader
     * @param trader Address of the trader receiving WETH
     * @param ethPrice Current ETH price from oracle (8 decimals)
     * @return usdcRequired USDC amount the router must pay this vault
     */
    function executeSwap(
        uint256 wethAmount,
        address trader,
        uint256 ethPrice
    ) external override nonReentrant onlyRouter whenNotPaused returns (uint256 usdcRequired) {
        if (wethAmount == 0) revert ZeroAmount();
        if (ethPrice < minPrice) revert PriceBelowMinimum(ethPrice, minPrice);

        // Check utilization limit against current WETH balance
        uint256 wethBalance = weth.balanceOf(address(this));
        uint256 maxUsable = (wethBalance * maxUtilizationBps) / 10000;
        if (wethAmount > maxUsable) revert UtilizationExceeded(wethAmount, maxUsable);

        // Calculate USDC required (what the trader pays for this WETH)
        // usdcRequired = wethAmount (18 dec) * ethPrice (8 dec) / 1e20
        // This converts WETH to its USD value in USDC (6 decimals)
        // wethAmount * ethPrice / 1e20 gives us the value in 6 decimal USDC
        usdcRequired = (wethAmount * ethPrice) / 1e20;

        // Calculate fee (fee is earned on top, paid by trader via router)
        uint256 feeUsdc = (usdcRequired * feeBps) / 10000;

        // Effects
        totalFeesEarned += feeUsdc;
        totalVolumeRouted += usdcRequired;
        totalWethSold += wethAmount;
        tradeCount++;

        // Interactions: Send WETH to trader
        weth.safeTransfer(trader, wethAmount);

        emit SwapExecuted(trader, wethAmount, usdcRequired, feeUsdc, ethPrice);

        // Return total USDC the router needs to send to this vault
        // (includes the fee — trader pays slightly more USDC)
        usdcRequired = usdcRequired + feeUsdc;
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Returns available WETH liquidity for swaps
     */
    function availableLiquidity() external view override returns (uint256) {
        return weth.balanceOf(address(this));
    }

    /**
     * @notice Returns accumulated USDC balance (from swap payments + fees)
     */
    function usdcBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Returns the maximum WETH usable in a single trade
     */
    function maxSwapAmount() external view returns (uint256) {
        return (weth.balanceOf(address(this)) * maxUtilizationBps) / 10000;
    }

    /**
     * @notice Get a quote: how much USDC for a given WETH amount
     * @param wethAmount Amount of WETH to quote
     * @param ethPrice Current ETH price (8 decimals)
     * @return usdcCost Total USDC the trader would pay (including fee)
     * @return fee Fee portion in USDC
     * @return effectivePrice Effective price per ETH in USDC terms (8 decimals)
     */
    function getQuote(
        uint256 wethAmount,
        uint256 ethPrice
    ) external view returns (uint256 usdcCost, uint256 fee, uint256 effectivePrice) {
        uint256 baseUsdc = (wethAmount * ethPrice) / 1e20;
        fee = (baseUsdc * feeBps) / 10000;
        usdcCost = baseUsdc + fee;
        // Effective price = usdcCost * 1e20 / wethAmount (back to 8 decimals)
        effectivePrice = wethAmount > 0 ? (usdcCost * 1e20) / wethAmount : 0;
    }

    /**
     * @notice Get vault statistics for dashboard
     */
    function getVaultStats() external view returns (
        uint256 _wethBalance,
        uint256 _usdcBalance,
        uint256 _totalDeposited,
        uint256 _totalFeesEarned,
        uint256 _totalVolume,
        uint256 _totalWethSold,
        uint256 _tradeCount
    ) {
        _wethBalance = weth.balanceOf(address(this));
        _usdcBalance = usdc.balanceOf(address(this));
        _totalDeposited = totalDeposited;
        _totalFeesEarned = totalFeesEarned;
        _totalVolume = totalVolumeRouted;
        _totalWethSold = totalWethSold;
        _tradeCount = tradeCount;
    }
}
