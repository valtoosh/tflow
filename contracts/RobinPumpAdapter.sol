// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ========== INTERFACES ==========

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

interface IRobinPumpPool {
    function getCurrentPrice() external view returns (uint256);
    function getBuyQuote(uint256 ethAmount) external view returns (uint256 tokenAmount);
    function getSellQuote(uint256 tokenAmount) external view returns (uint256 ethAmount);
    function buyTokens(uint256 minTokensOut) external payable;
    function sellTokens(uint256 tokenAmount, uint256 minEthOut) external;
    function poolInfo() external view returns (PoolInfo memory);
    function token() external view returns (address);
}

interface IRobinPumpFactory {
    function getPool(address token) external view returns (address);
    function getAllPools() external view returns (address[] memory);
    function getPoolsByCreator(address creator) external view returns (address[] memory);
}

/**
 * @title RobinPumpAdapter
 * @notice Adapter contract to integrate RobinPump bonding curve trading with TigerFlow
 * @dev Acts as a bridge between TigerFlowRouter and RobinPump pools
 * Security: ReentrancyGuard, SafeERC20, onlyRouter, comprehensive input validation
 */
contract RobinPumpAdapter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ========== STATE VARIABLES ==========
    
    IRobinPumpFactory public factory;
    address public router;
    
    // Safety limits - 4% max slippage
    uint256 public constant MAX_SLIPPAGE_BPS = 400;
    uint256 public constant MIN_TRADE_SIZE = 0.001 ether;
    uint256 public constant MAX_TRADE_SIZE = 100 ether;
    
    // ========== EVENTS ==========
    
    event BuyExecuted(address indexed token, uint256 ethIn, uint256 tokensOut, uint256 price);
    event SellExecuted(address indexed token, uint256 tokensIn, uint256 ethOut, uint256 price);
    event RouterUpdated(address indexed oldRouter, address indexed newRouter);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);
    event TokensRescued(address indexed token, address indexed to, uint256 amount);
    event ETHRescued(address indexed to, uint256 amount);
    
    // ========== ERRORS ==========
    
    error InvalidFactory();
    error InvalidRouter();
    error InvalidToken();
    error InvalidAmount();
    error InvalidSlippage();
    error TradeTooSmall();
    error TradeTooLarge();
    error PoolNotFound(address token);
    error PoolAlreadyGraduated(address token);
    error InsufficientOutput(uint256 received, uint256 minimum);
    error TransferFailed();
    error ETHTransferFailed();
    error PriceManipulationDetected(uint256 oldPrice, uint256 newPrice);
    
    // ========== MODIFIERS ==========
    
    modifier onlyRouter() {
        if (msg.sender != router) revert InvalidRouter();
        _;
    }
    
    modifier validToken(address token) {
        if (token == address(0)) revert InvalidToken();
        _;
    }
    
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        if (amount < MIN_TRADE_SIZE) revert TradeTooSmall();
        if (amount > MAX_TRADE_SIZE) revert TradeTooLarge();
        _;
    }
    
    // ========== CONSTRUCTOR ==========
    
    constructor(address _factory, address _router) Ownable(msg.sender) {
        if (_factory == address(0)) revert InvalidFactory();
        if (_router == address(0)) revert InvalidRouter();
        factory = IRobinPumpFactory(_factory);
        router = _router;
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    function getBuyQuote(address token, uint256 ethAmount) 
        external 
        view 
        validToken(token) 
        validAmount(ethAmount) 
        returns (uint256 tokenAmount) 
    {
        address pool = factory.getPool(token);
        if (pool == address(0)) revert PoolNotFound(token);
        
        PoolInfo memory info = IRobinPumpPool(pool).poolInfo();
        if (info.graduated) revert PoolAlreadyGraduated(token);
        
        return IRobinPumpPool(pool).getBuyQuote(ethAmount);
    }
    
    function getSellQuote(address token, uint256 tokenAmount) 
        external 
        view 
        validToken(token) 
        validAmount(tokenAmount) 
        returns (uint256 ethAmount) 
    {
        address pool = factory.getPool(token);
        if (pool == address(0)) revert PoolNotFound(token);
        
        PoolInfo memory info = IRobinPumpPool(pool).poolInfo();
        if (info.graduated) revert PoolAlreadyGraduated(token);
        
        return IRobinPumpPool(pool).getSellQuote(tokenAmount);
    }
    
    function getCurrentPrice(address token) 
        external 
        view 
        validToken(token) 
        returns (uint256 price) 
    {
        address pool = factory.getPool(token);
        if (pool == address(0)) revert PoolNotFound(token);
        
        return IRobinPumpPool(pool).getCurrentPrice();
    }
    
    function hasActivePool(address token) 
        external 
        view 
        validToken(token) 
        returns (bool) 
    {
        address pool = factory.getPool(token);
        if (pool == address(0)) return false;
        
        try IRobinPumpPool(pool).poolInfo() returns (PoolInfo memory info) {
            return !info.graduated;
        } catch {
            return false;
        }
    }
    
    function getActivePools() 
        external 
        view 
        returns (address[] memory tokens, address[] memory pools) 
    {
        address[] memory allPools = factory.getAllPools();
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            try IRobinPumpPool(allPools[i]).poolInfo() returns (PoolInfo memory info) {
                if (!info.graduated) {
                    activeCount++;
                }
            } catch {}
        }
        
        tokens = new address[](activeCount);
        pools = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            try IRobinPumpPool(allPools[i]).poolInfo() returns (PoolInfo memory info) {
                if (!info.graduated) {
                    pools[index] = allPools[i];
                    tokens[index] = info.token;
                    index++;
                }
            } catch {}
        }
        
        return (tokens, pools);
    }
    
    // ========== EXECUTE FUNCTIONS ==========
    
    function executeBuy(
        address token,
        uint256 minTokensOut
    ) 
        external 
        payable 
        onlyRouter 
        nonReentrant 
        validToken(token) 
        validAmount(msg.value) 
        returns (uint256 tokensOut) 
    {
        if (minTokensOut == 0) revert InvalidAmount();
        
        address pool = factory.getPool(token);
        if (pool == address(0)) revert PoolNotFound(token);
        
        PoolInfo memory info = IRobinPumpPool(pool).poolInfo();
        if (info.graduated) revert PoolAlreadyGraduated(token);
        
        uint256 priceBefore = IRobinPumpPool(pool).getCurrentPrice();
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        
        try IRobinPumpPool(pool).buyTokens{value: msg.value}(minTokensOut) {
            // Success
        } catch {
            revert TransferFailed();
        }
        
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        tokensOut = balanceAfter - balanceBefore;
        
        if (tokensOut < minTokensOut) {
            revert InsufficientOutput(tokensOut, minTokensOut);
        }
        
        uint256 priceAfter = IRobinPumpPool(pool).getCurrentPrice();
        uint256 priceChangeBps = priceAfter > priceBefore 
            ? ((priceAfter - priceBefore) * 10000) / priceBefore 
            : ((priceBefore - priceAfter) * 10000) / priceBefore;
        
        if (priceChangeBps > MAX_SLIPPAGE_BPS) {
            revert PriceManipulationDetected(priceBefore, priceAfter);
        }
        
        IERC20(token).safeTransfer(router, tokensOut);
        
        emit BuyExecuted(token, msg.value, tokensOut, priceAfter);
        
        return tokensOut;
    }
    
    function executeSell(
        address token,
        uint256 tokenAmount,
        uint256 minEthOut
    ) 
        external 
        onlyRouter 
        nonReentrant 
        validToken(token) 
        validAmount(tokenAmount) 
        returns (uint256 ethOut) 
    {
        if (minEthOut == 0) revert InvalidAmount();
        
        address pool = factory.getPool(token);
        if (pool == address(0)) revert PoolNotFound(token);
        
        PoolInfo memory info = IRobinPumpPool(pool).poolInfo();
        if (info.graduated) revert PoolAlreadyGraduated(token);
        
        uint256 priceBefore = IRobinPumpPool(pool).getCurrentPrice();
        
        IERC20(token).safeTransferFrom(router, address(this), tokenAmount);
        IERC20(token).forceApprove(pool, tokenAmount);
        
        uint256 ethBefore = address(this).balance;
        
        try IRobinPumpPool(pool).sellTokens(tokenAmount, minEthOut) {
            // Success
        } catch {
            revert TransferFailed();
        }
        
        uint256 ethAfter = address(this).balance;
        ethOut = ethAfter - ethBefore;
        
        if (ethOut < minEthOut) {
            revert InsufficientOutput(ethOut, minEthOut);
        }
        
        uint256 priceAfter = IRobinPumpPool(pool).getCurrentPrice();
        uint256 priceChangeBps = priceAfter > priceBefore 
            ? ((priceAfter - priceBefore) * 10000) / priceBefore 
            : ((priceBefore - priceAfter) * 10000) / priceBefore;
        
        if (priceChangeBps > MAX_SLIPPAGE_BPS) {
            revert PriceManipulationDetected(priceBefore, priceAfter);
        }
        
        (bool success, ) = router.call{value: ethOut}("");
        if (!success) revert ETHTransferFailed();
        
        emit SellExecuted(token, tokenAmount, ethOut, priceAfter);
        
        return ethOut;
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    function setRouter(address _router) external onlyOwner {
        if (_router == address(0)) revert InvalidRouter();
        if (_router == router) revert InvalidRouter();
        
        address oldRouter = router;
        router = _router;
        
        emit RouterUpdated(oldRouter, _router);
    }
    
    function setFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert InvalidFactory();
        if (_factory == address(factory)) revert InvalidFactory();
        
        address oldFactory = address(factory);
        factory = IRobinPumpFactory(_factory);
        
        emit FactoryUpdated(oldFactory, _factory);
    }
    
    function rescueETH(address payable to) external onlyOwner {
        if (to == address(0)) revert InvalidRouter();
        
        uint256 balance = address(this).balance;
        if (balance == 0) revert InvalidAmount();
        
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert ETHTransferFailed();
        
        emit ETHRescued(to, balance);
    }
    
    function rescueTokens(address token, address to) external onlyOwner validToken(token) {
        if (to == address(0)) revert InvalidRouter();
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert InvalidAmount();
        
        IERC20(token).safeTransfer(to, balance);
        
        emit TokensRescued(token, to, balance);
    }
    
    receive() external payable {}
}
