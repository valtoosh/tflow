// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../TigerFlowRouterV2.sol";
import "../LiquidityVault.sol";
import "../TigerFlowOracle.sol";

contract DeployV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        address usdc = vm.envAddress("USDC_ADDRESS");
        address weth = vm.envAddress("WETH_ADDRESS");
        address uniswapRouter = vm.envAddress("UNISWAP_ROUTER");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Oracle
        TigerFlowOracle oracle = new TigerFlowOracle();
        console.log("Oracle deployed at:", address(oracle));
        
        // Deploy Router V2
        TigerFlowRouterV2 router = new TigerFlowRouterV2(
            usdc,
            weth,
            address(oracle),
            uniswapRouter
        );
        console.log("Router V2 deployed at:", address(router));
        
        // Create vaults with different fee tiers
        address[] memory vaults = new address[](3);
        uint256[] memory priorities = new uint256[](3);
        
        // Alpha Vault - Low fee, high priority
        vaults[0] = address(new LiquidityVault(
            weth,
            usdc,
            address(router),
            msg.sender,
            12, // 0.12%
            1000e8,
            5000
        ));
        priorities[0] = 200;
        console.log("Alpha Vault deployed at:", vaults[0]);
        
        // Beta Vault - Medium fee, medium priority
        vaults[1] = address(new LiquidityVault(
            weth,
            usdc,
            address(router),
            msg.sender,
            15, // 0.15%
            1000e8,
            5000
        ));
        priorities[1] = 100;
        console.log("Beta Vault deployed at:", vaults[1]);
        
        // Gamma Vault - Low fee, low priority
        vaults[2] = address(new LiquidityVault(
            weth,
            usdc,
            address(router),
            msg.sender,
            10, // 0.10%
            1000e8,
            5000
        ));
        priorities[2] = 50;
        console.log("Gamma Vault deployed at:", vaults[2]);
        
        // Register vaults with priorities
        for (uint i = 0; i < vaults.length; i++) {
            router.registerVault(vaults[i], priorities[i]);
        }
        
        // Set initial ETH price
        oracle.updatePrice(2000e8);
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("Oracle:", address(oracle));
        console.log("Router V2:", address(router));
        console.log("Alpha Vault:", vaults[0]);
        console.log("Beta Vault:", vaults[1]);
        console.log("Gamma Vault:", vaults[2]);
    }
}
