export const LIQUIDITY_VAULT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_weth", "type": "address" },
      { "internalType": "address", "name": "_usdc", "type": "address" },
      { "internalType": "address", "name": "_router", "type": "address" },
      { "internalType": "address", "name": "_owner", "type": "address" },
      { "internalType": "uint256", "name": "_feeBps", "type": "uint256" },
      { "internalType": "uint256", "name": "_minPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "_maxUtilizationBps", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "withdrawWeth",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "withdrawUsdc",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "availableLiquidity",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdcBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVaultStats",
    "outputs": [
      { "internalType": "uint256", "name": "_wethBalance", "type": "uint256" },
      { "internalType": "uint256", "name": "_usdcBalance", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalDeposited", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalFeesEarned", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalVolume", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalWethSold", "type": "uint256" },
      { "internalType": "uint256", "name": "_tradeCount", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeBps",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxUtilizationBps",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDeposited",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalFeesEarned",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tradeCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "depositor", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "wethAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "newBalance", "type": "uint256" }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "Withdrawn",
    "type": "event"
  }
] as const;
