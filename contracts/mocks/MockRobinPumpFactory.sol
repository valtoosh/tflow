// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockRobinPumpFactory
 * @notice Mock RobinPump factory for hackathon demo on Base Sepolia
 */
contract MockRobinPumpFactory {
    
    struct PoolInfo {
        address token;
        address creator;
        uint256 virtualEth;
        uint256 virtualTokens;
        uint256 realEth;
        uint256 realTokens;
        bool graduated;
        address uniswapPair;
    }
    
    struct MockPool {
        address token;
        uint256 currentPrice;
        uint256 totalVolume;
        bool graduated;
    }
    
    mapping(address => address) public getPool; // token => pool
    address[] public allPools;
    mapping(address => MockPool) public pools;
    
    event PoolCreated(address indexed token, address indexed pool, uint256 initialPrice);
    
    function createMockPool(
        address token,
        uint256 initialPrice
    ) external returns (address poolAddress) {
        require(getPool[token] == address(0), "Pool exists");
        
        poolAddress = address(new MockRobinPumpPool(token, initialPrice));
        
        getPool[token] = poolAddress;
        allPools.push(poolAddress);
        pools[poolAddress] = MockPool({
            token: token,
            currentPrice: initialPrice,
            totalVolume: 0,
            graduated: false
        });
        
        emit PoolCreated(token, poolAddress, initialPrice);
        return poolAddress;
    }
    
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }
    
    function getPoolsByCreator(address) external pure returns (address[] memory) {
        return new address[](0);
    }
}

contract MockRobinPumpPool {
    
    address public token;
    uint256 public currentPrice;
    uint256 public constant VIRTUAL_ETH = 100 ether;
    uint256 public virtualTokens;
    uint256 public realEth;
    uint256 public realTokens;
    bool public graduated;
    
    struct PoolInfo {
        address token;
        address creator;
        uint256 virtualEth;
        uint256 virtualTokens;
        uint256 realEth;
        uint256 realTokens;
        bool graduated;
        address uniswapPair;
    }
    
    constructor(address _token, uint256 _initialPrice) {
        token = _token;
        currentPrice = _initialPrice;
        virtualTokens = VIRTUAL_ETH * 1e18 / _initialPrice;
    }
    
    function getCurrentPrice() external view returns (uint256) {
        return currentPrice;
    }
    
    function getBuyQuote(uint256 ethAmount) external view returns (uint256) {
        // Simple bonding curve: tokens = eth / price
        return ethAmount * 1e18 / currentPrice;
    }
    
    function getSellQuote(uint256 tokenAmount) external view returns (uint256) {
        // Simple bonding curve: eth = tokens * price
        return tokenAmount * currentPrice / 1e18;
    }
    
    function buyTokens(uint256 minTokensOut) external payable {
        uint256 tokensOut = this.getBuyQuote(msg.value);
        require(tokensOut >= minTokensOut, "Slippage exceeded");
        
        realEth += msg.value;
        
        // Transfer tokens to buyer
        ERC20(token).transfer(msg.sender, tokensOut);
    }
    
    function sellTokens(uint256 tokenAmount, uint256 minEthOut) external {
        uint256 ethOut = this.getSellQuote(tokenAmount);
        require(ethOut >= minEthOut, "Slippage exceeded");
        
        // Transfer tokens from seller
        ERC20(token).transferFrom(msg.sender, address(this), tokenAmount);
        
        // Send ETH
        (bool success, ) = msg.sender.call{value: ethOut}("");
        require(success, "ETH transfer failed");
        
        realEth -= ethOut;
    }
    
    function poolInfo() external view returns (PoolInfo memory) {
        return PoolInfo({
            token: token,
            creator: address(0),
            virtualEth: VIRTUAL_ETH,
            virtualTokens: virtualTokens,
            realEth: realEth,
            realTokens: ERC20(token).balanceOf(address(this)),
            graduated: graduated,
            uniswapPair: address(0)
        });
    }
    
    receive() external payable {}
}
