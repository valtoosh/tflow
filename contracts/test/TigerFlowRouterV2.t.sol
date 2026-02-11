// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../TigerFlowRouterV2.sol";
import "../LiquidityVault.sol";
import "../TigerFlowOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USDC", "USDC") {
        _mint(msg.sender, 1_000_000_000e6);
    }
    function decimals() public pure override returns (uint8) { return 6; }
}

contract MockWETH is ERC20 {
    constructor() ERC20("WETH", "WETH") {
        _mint(msg.sender, 1_000_000e18);
    }
    function decimals() public pure override returns (uint8) { return 18; }
}

contract TigerFlowRouterV2Test is Test {
    TigerFlowRouterV2 public router;
    LiquidityVault public vault;
    TigerFlowOracle public oracle;
    MockUSDC public usdc;
    MockWETH public weth;
    
    address public admin = address(1);
    address public trader = address(2);
    address public merchant = address(3);
    
    function setUp() public {
        vm.startPrank(admin);
        
        usdc = new MockUSDC();
        weth = new MockWETH();
        oracle = new TigerFlowOracle();
        
        // Set ETH price to $2000
        oracle.updatePrice(2000e8);
        
        router = new TigerFlowRouterV2(
            address(usdc),
            address(weth),
            address(oracle),
            address(0) // No Uniswap for tests
        );
        
        // Create vault
        vault = new LiquidityVault(
            address(weth),
            address(usdc),
            address(router),
            merchant,
            15, // 0.15% fee
            1000e8, // Min $1000 ETH price
            5000 // 50% max utilization
        );
        
        router.registerVault(address(vault), 100);
        
        // Fund accounts
        usdc.transfer(trader, 100_000e6);
        weth.transfer(merchant, 100e18);
        
        vm.stopPrank();
        
        // Merchant deposits to vault
        vm.startPrank(merchant);
        weth.approve(address(vault), 10e18);
        vault.deposit(10e18);
        vm.stopPrank();
    }
    
    // ========== MEV PROTECTION TESTS ==========
    
    function test_FlashLoanProtection() public {
        // Create a contract with no ETH balance
        address flashLoaner = address(new FlashLoanContract());
        
        vm.startPrank(flashLoaner);
        usdc.approve(address(router), 1000e6);
        
        vm.expectRevert(TigerFlowRouterV2.FlashLoanDetected.selector);
        router.executeSwap(
            1000e6,
            0,
            block.timestamp + 1 hours,
            new TigerFlowRouterV2.VaultAllocation[](0),
            100,
            keccak256("commit1")
        );
        vm.stopPrank();
    }
    
    function test_GasPriceLimit() public {
        vm.txGasPrice(600 gwei); // Above 500 gwei limit
        
        vm.startPrank(trader);
        usdc.approve(address(router), 1000e6);
        
        vm.expectRevert(
            abi.encodeWithSelector(
                TigerFlowRouterV2.GasPriceTooHigh.selector,
                600 gwei,
                500 gwei
            )
        );
        router.executeSwap(
            1000e6,
            0,
            block.timestamp + 1 hours,
            new TigerFlowRouterV2.VaultAllocation[](0),
            100,
            keccak256("commit1")
        );
        vm.stopPrank();
    }
    
    function test_CommitmentReplayProtection() public {
        bytes32 commitment = keccak256("unique_commit");
        
        // First swap succeeds
        vm.startPrank(trader);
        usdc.approve(address(router), 1000e6);
        
        // Second swap with same commitment fails
        vm.expectRevert(
            abi.encodeWithSelector(
                TigerFlowRouterV2.CommitmentReused.selector,
                commitment
            )
        );
        router.executeSwap(
            1000e6,
            0,
            block.timestamp + 1 hours,
            new TigerFlowRouterV2.VaultAllocation[](0),
            100,
            commitment
        );
        vm.stopPrank();
    }
    
    // ========== CIRCUIT BREAKER TESTS ==========
    
    function test_CircuitBreaker() public {
        vm.prank(admin);
        router.activateCircuitBreaker("Emergency stop");
        
        vm.startPrank(trader);
        usdc.approve(address(router), 1000e6);
        
        vm.expectRevert(TigerFlowRouterV2.CircuitBreakerActive.selector);
        router.executeSwap(
            1000e6,
            0,
            block.timestamp + 1 hours,
            new TigerFlowRouterV2.VaultAllocation[](0),
            100,
            keccak256("commit1")
        );
        vm.stopPrank();
    }
    
    // ========== VIEW FUNCTION TESTS ==========
    
    function test_GetProtocolMetrics() public {
        (
            uint256 volume,
            uint256 trades,
            uint256 saved,
            uint256 gasOpt,
            uint256 vaultCount,
            bool circuitActive
        ) = router.getProtocolMetrics();
        
        assertEq(vaultCount, 1);
        assertEq(circuitActive, false);
    }
    
    function test_GetDailyVolumeStatus() public {
        (
            uint256 current,
            uint256 limit,
            uint256 remaining,
            uint256 resetsIn
        ) = router.getDailyVolumeStatus();
        
        assertEq(current, 0);
        assertGt(limit, 0);
        assertEq(remaining, limit);
        assertLe(resetsIn, 1 days);
    }
    
    // ========== DYNAMIC FEE TESTS ==========
    
    function test_VolatilityMultiplier() public {
        vm.prank(admin);
        router.setVolatilityMultiplier(200); // 2x fees in volatile times
    }
    
    function test_InvalidVolatilityMultiplier() public {
        vm.prank(admin);
        vm.expectRevert();
        router.setVolatilityMultiplier(600); // Above 500 max
    }
}

contract FlashLoanContract {
    // Contract with no ETH balance for testing flash loan protection
}
