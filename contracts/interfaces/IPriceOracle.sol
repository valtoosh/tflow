// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPriceOracle
 * @notice Interface for price oracle used by TigerFlow for price validation
 */
interface IPriceOracle {
    /// @notice Returns the latest ETH/USD price with 8 decimals
    /// @return price The ETH price in USD (8 decimals)
    /// @return updatedAt Timestamp of the last price update
    function getLatestPrice() external view returns (uint256 price, uint256 updatedAt);

    /// @notice Validates that a given price is within acceptable deviation from oracle
    /// @param price The price to validate (8 decimals)
    /// @param maxDeviationBps Maximum allowed deviation in basis points
    /// @return valid Whether the price is within the acceptable range
    function validatePrice(uint256 price, uint256 maxDeviationBps) external view returns (bool valid);
}
