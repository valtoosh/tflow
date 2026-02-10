// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockChainlinkAggregator
 * @notice Mock Chainlink price feed for testing
 */
contract MockChainlinkAggregator {
    int256 public price;
    uint256 public updatedAt;
    uint80 public roundId;
    uint8 public decimals_ = 8;

    constructor(int256 _price) {
        price = _price;
        updatedAt = block.timestamp;
        roundId = 1;
    }

    function setPrice(int256 _price) external {
        price = _price;
        updatedAt = block.timestamp;
        roundId++;
    }

    function setStalePrice(int256 _price, uint256 _updatedAt) external {
        price = _price;
        updatedAt = _updatedAt;
        roundId++;
    }

    function setInvalidRound() external {
        roundId = 0;
    }

    function decimals() external view returns (uint8) {
        return decimals_;
    }

    function latestRoundData() external view returns (
        uint80 roundId_,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt_,
        uint80 answeredInRound
    ) {
        return (roundId, price, updatedAt, updatedAt, roundId);
    }
}
