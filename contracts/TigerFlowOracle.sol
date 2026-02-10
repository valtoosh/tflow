// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title TigerFlowOracle
 * @author TigerFlow
 * @notice Wraps Chainlink ETH/USD price feed on Base with staleness checks
 * @dev Uses Chainlink's AggregatorV3Interface for reliable price data
 */
contract TigerFlowOracle is IPriceOracle {

    AggregatorV3Interface public immutable priceFeed;
    uint256 public constant MAX_STALENESS = 3600; // 1 hour

    error OracleStalePrice(uint256 updatedAt, uint256 currentTime);
    error OracleInvalidPrice(int256 price);
    error OracleInvalidRound(uint80 roundId);

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
     * @notice Returns the latest ETH/USD price with 8 decimals
     * @return price The ETH price in USD (8 decimals)
     * @return updatedAt Timestamp of the last price update
     */
    function getLatestPrice() external view override returns (uint256 price, uint256 updatedAt) {
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAtRaw,
        ) = priceFeed.latestRoundData();

        if (roundId == 0) revert OracleInvalidRound(roundId);
        if (answer <= 0) revert OracleInvalidPrice(answer);
        if (block.timestamp - updatedAtRaw > MAX_STALENESS) {
            revert OracleStalePrice(updatedAtRaw, block.timestamp);
        }

        price = uint256(answer);
        updatedAt = updatedAtRaw;
    }

    /**
     * @notice Validates that a given price is within acceptable deviation from oracle
     * @param price The price to validate (8 decimals)
     * @param maxDeviationBps Maximum allowed deviation in basis points (e.g., 200 = 2%)
     * @return valid Whether the price is within the acceptable range
     */
    function validatePrice(
        uint256 price,
        uint256 maxDeviationBps
    ) external view override returns (bool valid) {
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = priceFeed.latestRoundData();

        if (answer <= 0) return false;
        if (block.timestamp - updatedAt > MAX_STALENESS) return false;

        uint256 oraclePrice = uint256(answer);
        uint256 deviation;

        if (price > oraclePrice) {
            deviation = ((price - oraclePrice) * 10000) / oraclePrice;
        } else {
            deviation = ((oraclePrice - price) * 10000) / oraclePrice;
        }

        valid = deviation <= maxDeviationBps;
    }
}
