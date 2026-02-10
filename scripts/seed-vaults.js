const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Seeding vaults with liquidity...");
    console.log("Deployer:", deployer.address);
    
    // Deployment addresses from previous deployment
    const ADDRESSES = {
        router: "0x398506f0E0e18647d3A0e574c94752DdC44f5060",
        vaultAlpha: "0xd0CB44B07e922d3bc276061bCB9eF41e103Cc872",
        vaultBeta: "0x964d800A7Bf5353084fE6360D22390ABec46f11F",
        vaultGamma: "0xdDb014C771236CD62e1F3eD6cC9459163960bBDA",
        weth: "0x4200000000000000000000000000000000000006",
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    };

    // Small deposits for demo (we have limited test ETH)
    const VAULTS = [
        { name: "Alpha", address: ADDRESSES.vaultAlpha, deposit: hre.ethers.parseEther("0.005") },
        { name: "Beta", address: ADDRESSES.vaultBeta, deposit: hre.ethers.parseEther("0.003") },
        { name: "Gamma", address: ADDRESSES.vaultGamma, deposit: hre.ethers.parseEther("0.002") }
    ];

    // WETH ABI for deposit/withdraw
    const WETH_ABI = [
        "function deposit() payable",
        "function withdraw(uint256 amount)",
        "function balanceOf(address account) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ];
    
    // Get WETH contract
    const weth = await hre.ethers.getContractAt(WETH_ABI, ADDRESSES.weth);
    
    // Check ETH balance
    const ethBalance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("\nETH Balance:", hre.ethers.formatEther(ethBalance), "ETH");
    
    // Wrap ETH to WETH
    const totalNeeded = VAULTS.reduce((acc, v) => acc + v.deposit, 0n);
    console.log("Total WETH needed:", hre.ethers.formatEther(totalNeeded), "WETH");
    
    const wethBalance = await weth.balanceOf(deployer.address);
    console.log("Current WETH balance:", hre.ethers.formatEther(wethBalance), "WETH");
    
    if (wethBalance < totalNeeded) {
        const toWrap = totalNeeded - wethBalance + hre.ethers.parseEther("0.01"); // Extra for gas buffer
        console.log("\nWrapping", hre.ethers.formatEther(toWrap), "ETH to WETH...");
        
        const wrapTx = await weth.deposit({ value: toWrap });
        await wrapTx.wait();
        console.log("✓ Wrapped successfully");
    }

    // Deposit to each vault
    console.log("\n========== DEPOSITING TO VAULTS ==========\n");
    
    // Add delay between transactions to avoid nonce issues
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const vault of VAULTS) {
        const vaultContract = await hre.ethers.getContractAt("LiquidityVault", vault.address);
        
        // Check current allowance
        const currentAllowance = await weth.allowance(deployer.address, vault.address);
        if (currentAllowance < vault.deposit) {
            // Approve WETH
            console.log(`Approving ${vault.name} vault to spend WETH...`);
            const approveTx = await weth.approve(vault.address, vault.deposit);
            await approveTx.wait();
            await delay(2000); // Wait 2 seconds
        }
        
        // Deposit
        console.log(`Depositing ${hre.ethers.formatEther(vault.deposit)} WETH to ${vault.name}...`);
        const depositTx = await vaultContract.deposit(vault.deposit);
        await depositTx.wait();
        await delay(2000); // Wait 2 seconds
        
        // Verify
        const liquidity = await vaultContract.availableLiquidity();
        console.log(`✓ ${vault.name} vault liquidity: ${hre.ethers.formatEther(liquidity)} WETH\n`);
    }

    // Summary
    console.log("========== VAULTS SEEDED ==========\n");
    
    const router = await hre.ethers.getContractAt("TigerFlowRouter", ADDRESSES.router);
    const [vaults, liquidities, fees] = await router.getActiveVaults();
    
    let totalLiquidity = 0n;
    for (let i = 0; i < vaults.length; i++) {
        console.log(`Vault ${i + 1}: ${vaults[i]}`);
        console.log(`  Liquidity: ${hre.ethers.formatEther(liquidities[i])} WETH`);
        console.log(`  Fee: ${fees[i] / 100}%`);
        totalLiquidity += liquidities[i];
    }
    
    console.log(`\nTotal Liquidity: ${hre.ethers.formatEther(totalLiquidity)} WETH`);
    console.log("\n🐯 Vaults are ready for trading! 🐯\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
