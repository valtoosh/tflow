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
  
  console.log("\n========== DEPLOYING TIGERFLOW V2 ==========\n");

  // 1. Deploy MockRobinPumpFactory
  console.log("1. Deploying MockRobinPumpFactory...");
  const MockRobinPumpFactory = await hre.ethers.getContractFactory("MockRobinPumpFactory");
  const robinPumpFactory = await MockRobinPumpFactory.deploy();
  await robinPumpFactory.waitForDeployment();
  console.log("   Factory deployed at:", await robinPumpFactory.getAddress());

  // 2. Create mock tokens and pools for demo
  console.log("\n2. Creating mock RobinPump tokens...");
  
  // Deploy mock tokens
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  
  const tigerToken = await MockERC20.deploy("Tiger Token", "TIGER", 18);
  await tigerToken.waitForDeployment();
  console.log("   TIGER token:", await tigerToken.getAddress());
  
  const baseToken = await MockERC20.deploy("Base Moon", "BASE", 18);
  await baseToken.waitForDeployment();
  console.log("   BASE token:", await baseToken.getAddress());
  
  const pumpToken = await MockERC20.deploy("Pump It", "PUMP", 18);
  await pumpToken.waitForDeployment();
  console.log("   PUMP token:", await pumpToken.getAddress());

  // Create pools
  await robinPumpFactory.createMockPool(await tigerToken.getAddress(), hre.ethers.parseEther("0.00042"));
  await robinPumpFactory.createMockPool(await baseToken.getAddress(), hre.ethers.parseEther("0.00018"));
  await robinPumpFactory.createMockPool(await pumpToken.getAddress(), hre.ethers.parseEther("0.000065"));
  console.log("   Created 3 mock pools");

  // 3. Deploy RobinPumpAdapter
  console.log("\n3. Deploying RobinPumpAdapter...");
  const RobinPumpAdapter = await hre.ethers.getContractFactory("RobinPumpAdapter");
  const robinPumpAdapter = await RobinPumpAdapter.deploy(
    await robinPumpFactory.getAddress(),
    deployer.address // Temporary
  );
  await robinPumpAdapter.waitForDeployment();
  console.log("   Adapter deployed at:", await robinPumpAdapter.getAddress());

  // 4. Deploy TigerFlowRouterV2
  console.log("\n4. Deploying TigerFlowRouterV2...");
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

  // 5. Update RobinPumpAdapter with correct router
  console.log("\n5. Updating adapter router...");
  await robinPumpAdapter.setRouter(await routerV2.getAddress());
  console.log("   Router updated");

  // 6. Register existing vaults
  console.log("\n6. Registering vaults...");
  const vaults = [
    "0xaF9b0ebc6B03F199EBCD7C9EEcd00bEdc54e3C76",
    "0x1CB5c322Bc4F71914F9f2AEF38FeE4fa68Dc1337",
    "0x4e1Ab1F0a038e404cBf8006109Ef741a4e0bC170"
  ];

  for (const vault of vaults) {
    await routerV2.registerVault(vault);
    console.log("   Registered:", vault);
  }

  console.log("\n========== DEPLOYMENT COMPLETE ==========\n");
  console.log("Network: baseSepolia\n");
  console.log("V2 Contracts:");
  console.log("  RobinPumpFactory:  ", await robinPumpFactory.getAddress());
  console.log("  RobinPumpAdapter:  ", await robinPumpAdapter.getAddress());
  console.log("  Router V2:         ", await routerV2.getAddress());
  console.log("\nMock Tokens:");
  console.log("  TIGER:             ", await tigerToken.getAddress());
  console.log("  BASE:              ", await baseToken.getAddress());
  console.log("  PUMP:              ", await pumpToken.getAddress());

  // Save deployment
  const deploymentData = {
    network: "baseSepolia",
    timestamp: Date.now(),
    contracts: {
      robinPumpFactory: await robinPumpFactory.getAddress(),
      robinPumpAdapter: await robinPumpAdapter.getAddress(),
      routerV2: await routerV2.getAddress(),
      mockTokens: {
        tiger: await tigerToken.getAddress(),
        base: await baseToken.getAddress(),
        pump: await pumpToken.getAddress()
      },
      oracle: ORACLE,
      vaults: {
        alpha: vaults[0],
        beta: vaults[1],
        gamma: vaults[2]
      },
      tokens: { usdc: USDC, weth: WETH }
    }
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);
  
  fs.writeFileSync(
    path.join(deploymentsDir, `baseSepolia-v2-${Date.now()}.json`),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("\n🐯 TigerFlow V2 is ready! 🐯");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
