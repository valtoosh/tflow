// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITigerFlowVault
 * @notice Interface for merchant liquidity vaults used by the TigerFlow router
 * @dev Vaults hold WETH. Traders swap USDC→WETH. Vault sends WETH to trader,
 *      receives USDC as payment, and earns a fee.
 */
interface ITigerFlowVault {
    /// @notice Returns the vault owner (merchant)
    function owner() external view returns (address);

    /// @notice Returns the available WETH liquidity that can be used for swaps
    function availableLiquidity() external view returns (uint256);

    /// @notice Returns the vault's fee in basis points (e.g., 15 = 0.15%)
    function feeBps() external view returns (uint256);

    /// @notice Returns the minimum ETH price (in USD, 8 decimals) the vault will sell at
    function minPrice() external view returns (uint256);

    /// @notice Returns the max percentage of the vault usable per trade (in basis points)
    function maxUtilizationBps() external view returns (uint256);

    /// @notice Execute a swap: send WETH to trader, receive USDC via router
    /// @param wethAmount The amount of WETH to send to the trader
    /// @param trader The address receiving WETH
    /// @param ethPrice The current ETH price (8 decimals) used for fee calculation
    /// @return usdcRequired The USDC amount the router must send to this vault as payment
    function executeSwap(
        uint256 wethAmount,
        address trader,
        uint256 ethPrice
    ) external returns (uint256 usdcRequired);
}
