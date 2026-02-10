const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    // ========== Configuration ==========
    const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const WETH_ADDRESS = process.env.WETH_ADDRESS || "0x4200000000000000000000000000000000000006";
    const CHAINLINK_ETH_USD = process.env.CHAINLINK_ETH_USD || "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";
    const UNISWAP_ROUTER = process.env.UNISWAP_ROUTER || "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";

    console.log("\n========== DEPLOYING TIGERFLOW ==========\n");

    // ========== 1. Deploy Oracle ==========
    console.log("1. Deploying TigerFlowOracle...");
    const Oracle = await hre.ethers.getContractFactory("TigerFlowOracle");
    const oracle = await Oracle.deploy(CHAINLINK_ETH_USD);
    await oracle.waitForDeployment();
    const oracleAddr = await oracle.getAddress();
    console.log("   Oracle deployed at:", oracleAddr);

    try {
        const [price, updatedAt] = await oracle.getLatestPrice();
        console.log("   ETH Price:", hre.ethers.formatUnits(price, 8), "USD");
    } catch (e) {
        console.log("   Warning: Oracle price fetch failed:", e.message);
    }

    // ========== 2. Deploy Router ==========
    console.log("\n2. Deploying TigerFlowRouter...");
    const Router = await hre.ethers.getContractFactory("TigerFlowRouter");
    const router = await Router.deploy(
        USDC_ADDRESS,
        WETH_ADDRESS,
        oracleAddr,
        UNISWAP_ROUTER
    );
    await router.waitForDeployment();
    const routerAddr = await router.getAddress();
    console.log("   Router deployed at:", routerAddr);

    // ========== 3. Deploy Demo Vaults (WETH vaults) ==========
    const vaultConfigs = [
        { name: "Tiger Vault Alpha", feeBps: 12, minPrice: 100000000000n, maxUtilBps: 2500 },
        { name: "Tiger Vault Beta", feeBps: 15, minPrice: 100000000000n, maxUtilBps: 2000 },
        { name: "Tiger Vault Gamma", feeBps: 10, minPrice: 100000000000n, maxUtilBps: 3000 },
    ];

    const vaults = [];
    console.log("\n3. Deploying Merchant WETH Vaults...");

    const Vault = await hre.ethers.getContractFactory("LiquidityVault");

    for (let i = 0; i < vaultConfigs.length; i++) {
        const config = vaultConfigs[i];
        console.log(`   Deploying ${config.name}...`);

        const vault = await Vault.deploy(
            WETH_ADDRESS,
            USDC_ADDRESS,
            routerAddr,
            deployer.address,
            config.feeBps,
            config.minPrice,
            config.maxUtilBps
        );
        await vault.waitForDeployment();
        const vaultAddr = await vault.getAddress();
        console.log(`   ${config.name} deployed at: ${vaultAddr}`);
        console.log(`     Fee: ${config.feeBps / 100}% | Max Util: ${config.maxUtilBps / 100}%`);

        vaults.push({ address: vaultAddr, ...config });

        // Register with router
        const tx = await router.registerVault(vaultAddr);
        await tx.wait();
        console.log(`   Registered ${config.name} with router`);
    }

    // ========== 4. Summary ==========
    console.log("\n========== DEPLOYMENT COMPLETE ==========\n");
    console.log("Network:", hre.network.name);
    console.log("\nContracts:");
    console.log("  Oracle:        ", oracleAddr);
    console.log("  Router:        ", routerAddr);
    vaults.forEach((v, i) => {
        console.log(`  Vault #${i + 1}:      `, v.address);
    });
    console.log("\nExternal:");
    console.log("  USDC:          ", USDC_ADDRESS);
    console.log("  WETH:          ", WETH_ADDRESS);
    console.log("  Chainlink:     ", CHAINLINK_ETH_USD);
    console.log("  Uniswap Router:", UNISWAP_ROUTER);

    // ========== 5. Save deployment ==========
    const deployment = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        timestamp: new Date().toISOString(),
        contracts: {
            oracle: oracleAddr,
            router: routerAddr,
            vaults: vaults.map(v => ({
                address: v.address,
                name: v.name,
                feeBps: v.feeBps,
                maxUtilBps: v.maxUtilBps,
            })),
        },
        external: {
            usdc: USDC_ADDRESS,
            weth: WETH_ADDRESS,
            chainlinkEthUsd: CHAINLINK_ETH_USD,
            uniswapRouter: UNISWAP_ROUTER,
        },
    };

    const fs = require("fs");
    const path = require("path");
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

    const filename = `${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(path.join(deploymentsDir, filename), JSON.stringify(deployment, null, 2));
    console.log(`\nDeployment saved to: deployments/${filename}`);

    // ========== 6. Verify on BaseScan ==========
    if (process.env.BASESCAN_API_KEY && hre.network.name !== "hardhat") {
        console.log("\nVerifying contracts on BaseScan...");
        try {
            await hre.run("verify:verify", { address: oracleAddr, constructorArguments: [CHAINLINK_ETH_USD] });
        } catch (e) { console.log("  Oracle:", e.message); }

        try {
            await hre.run("verify:verify", {
                address: routerAddr,
                constructorArguments: [USDC_ADDRESS, WETH_ADDRESS, oracleAddr, UNISWAP_ROUTER],
            });
        } catch (e) { console.log("  Router:", e.message); }

        for (const v of vaults) {
            try {
                const config = vaultConfigs.find(c => c.name === v.name);
                await hre.run("verify:verify", {
                    address: v.address,
                    constructorArguments: [
                        WETH_ADDRESS, USDC_ADDRESS, routerAddr, deployer.address,
                        config.feeBps, config.minPrice, config.maxUtilBps,
                    ],
                });
            } catch (e) { console.log(`  ${v.name}: ${e.message}`); }
        }
    }

    console.log("\n🐯 TigerFlow is ready to route! 🐯\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
