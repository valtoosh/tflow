const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying V2 contracts with:", deployer.address);
  console.log("Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Existing contract addresses from V1 deployment
  const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const WETH = "0x4200000000000000000000000000000000000006";
  const ORACLE = "0x708cF0E30Fe51800DDC879e97916074ac8548C67";
  const UNISWAP_ROUTER = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";
  
  // RobinPump addresses (placeholder - update with actual addresses)
  const ROBINPUMP_FACTORY = "0x0000000000000000000000000000000000000000"; // Update this

  console.log("\n========== DEPLOYING TIGERFLOW V2 ==========\n");

  // 1. Deploy RobinPumpAdapter
  console.log("1. Deploying RobinPumpAdapter...");
  const RobinPumpAdapter = await hre.ethers.getContractFactory("RobinPumpAdapter");
  const robinPumpAdapter = await RobinPumpAdapter.deploy(
    ROBINPUMP_FACTORY,
    deployer.address // Temporary router address, will update after router deployment
  );
  await robinPumpAdapter.waitForDeployment();
  console.log("   RobinPumpAdapter deployed at:", await robinPumpAdapter.getAddress());

  // 2. Deploy TigerFlowRouterV2
  console.log("\n2. Deploying TigerFlowRouterV2...");
  const TigerFlowRouterV2 = await hre.ethers.getContractFactory("TigerFlowRouterV2");
  const routerV2 = await TigerFlowRouterV2.deploy(
    USDC,
    WETH,
    ORACLE,
    UNISWAP_ROUTER,
    await robinPumpAdapter.getAddress()
  );
  await routerV2.waitForDeployment();
  console.log("   Router V2 deployed at:", await routerV2.getAddress());

  // 3. Update RobinPumpAdapter with correct router address
  console.log("\n3. Updating RobinPumpAdapter router...");
  await robinPumpAdapter.setRouter(await routerV2.getAddress());
  console.log("   Router updated to:", await routerV2.getAddress());

  // 4. Register existing vaults with new router
  console.log("\n4. Registering vaults with Router V2...");
  const vaults = [
    "0xaF9b0ebc6B03F199EBCD7C9EEcd00bEdc54e3C76", // Alpha
    "0x1CB5c322Bc4F71914F9f2AEF38FeE4fa68Dc1337", // Beta
    "0x4e1Ab1F0a038e404cBf8006109Ef741a4e0bC170"  // Gamma
  ];

  for (const vault of vaults) {
    await routerV2.registerVault(vault);
    console.log("   Registered vault:", vault);
  }

  console.log("\n========== DEPLOYMENT COMPLETE ==========\n");
  console.log("Network: baseSepolia\n");
  console.log("New V2 Contracts:");
  console.log("  RobinPumpAdapter:", await robinPumpAdapter.getAddress());
  console.log("  Router V2:        ", await routerV2.getAddress());
  console.log("\nExisting Contracts:");
  console.log("  Oracle:           ", ORACLE);
  console.log("  Vault Alpha:      ", vaults[0]);
  console.log("  Vault Beta:       ", vaults[1]);
  console.log("  Vault Gamma:      ", vaults[2]);

  // Save deployment
  const deploymentData = {
    network: "baseSepolia",
    timestamp: Date.now(),
    contracts: {
      robinPumpAdapter: await robinPumpAdapter.getAddress(),
      routerV2: await routerV2.getAddress(),
      oracle: ORACLE,
      vaults: {
        alpha: vaults[0],
        beta: vaults[1],
        gamma: vaults[2]
      },
      tokens: {
        usdc: USDC,
        weth: WETH
      }
    }
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filename = `baseSepolia-v2-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("\nDeployment saved to: deployments/" + filename);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
