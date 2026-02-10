// Base Sepolia Deployment Addresses
export const ADDRESSES = {
  router: "0x398506f0E0e18647d3A0e574c94752DdC44f5060",
  oracle: "0x460b023a87f7Dbe0114357Ab45830F1A41e9C103",
  vaults: {
    alpha: "0xd0CB44B07e922d3bc276061bCB9eF41e103Cc872",   // 0.12% fee
    beta: "0x964d800A7Bf5353084fE6360D22390ABec46f11F",    // 0.15% fee
    gamma: "0xdDb014C771236CD62e1F3eD6cC9459163960bBDA"   // 0.10% fee
  },
  tokens: {
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    weth: "0x4200000000000000000000000000000000000006"
  }
} as const;

// Base Sepolia Chain ID
export const CHAIN_ID = 84532;
