export const TIGER_FLOW_ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_usdc", "type": "address" },
      { "internalType": "address", "name": "_weth", "type": "address" },
      { "internalType": "address", "name": "_oracle", "type": "address" },
      { "internalType": "address", "name": "_uniswapRouter", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint256", "name": "currentTime", "type": "uint256" }],
    "name": "DeadlineExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAllocation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NothingToRescue",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyAdmin",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "received", "type": "uint256" }, { "internalType": "uint256", "name": "minimum", "type": "uint256" }],
    "name": "SlippageExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SwapFailed",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "expected", "type": "uint256" }, { "internalType": "uint256", "name": "actual", "type": "uint256" }],
    "name": "TotalAllocationMismatch",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "address", "name": "vault", "type": "address" }, { "internalType": "bytes", "name": "reason", "type": "bytes" }],
    "name": "VaultCallFailed",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "address", "name": "vault", "type": "address" }],
    "name": "VaultAlreadyRegistered",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "address", "name": "vault", "type": "address" }],
    "name": "VaultNotRegistered",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAmount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "oldAdmin", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newAdmin", "type": "address" }],
    "name": "AdminUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "ETHRescued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "oldOracle", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOracle", "type": "address" }],
    "name": "OracleUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "trader", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "usdcIn", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "wethOut", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "uniswapPortion", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "vaultPortion", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "totalFees", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "savings", "type": "uint256" }],
    "name": "SwapExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "TokensRescued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "vault", "type": "address" }, { "indexed": false, "internalType": "bytes", "name": "reason", "type": "bytes" }],
    "name": "VaultExecutionFailed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "vault", "type": "address" }],
    "name": "VaultRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "vault", "type": "address" }],
    "name": "VaultRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "vault", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "expectedAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "actualLiquidity", "type": "uint256" }],
    "name": "VaultSkipped",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_PRICE_DEVIATION_BPS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UNISWAP_FEE_TIER",
    "outputs": [{ "internalType": "uint24", "name": "", "type": "uint24" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "usdcAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "minWethOut", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      {
        "components": [
          { "internalType": "address", "name": "vault", "type": "address" },
          { "internalType": "uint256", "name": "wethAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "usdcCost", "type": "uint256" },
          { "internalType": "uint256", "name": "fee", "type": "uint256" }
        ],
        "internalType": "struct TigerFlowRouter.VaultAllocation[]",
        "name": "expectedAllocations",
        "type": "tuple[]"
      },
      { "internalType": "uint256", "name": "maxLiquiditySlippageBps", "type": "uint256" }
    ],
    "name": "executeSwap",
    "outputs": [{ "internalType": "uint256", "name": "wethOut", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveVaults",
    "outputs": [
      { "internalType": "address[]", "name": "vaults", "type": "address[]" },
      { "internalType": "uint256[]", "name": "liquidities", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "fees", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBestAvailableRate",
    "outputs": [
      { "internalType": "uint256", "name": "bestFeeBps", "type": "uint256" },
      { "internalType": "uint256", "name": "totalAvailableLiquidity", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "usdcAmount", "type": "uint256" }],
    "name": "getQuote",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "totalWethOut", "type": "uint256" },
          { "internalType": "uint256", "name": "totalUsdcCost", "type": "uint256" },
          { "internalType": "uint256", "name": "uniswapUsdcAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "uniswapWethOut", "type": "uint256" },
          { "internalType": "uint256", "name": "vaultUsdcAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "vaultWethOut", "type": "uint256" },
          { "internalType": "uint256", "name": "totalFees", "type": "uint256" },
          { "internalType": "uint256", "name": "savingsVsUniswap", "type": "uint256" },
          {
            "components": [
              { "internalType": "address", "name": "vault", "type": "address" },
              { "internalType": "uint256", "name": "wethAmount", "type": "uint256" },
              { "internalType": "uint256", "name": "usdcCost", "type": "uint256" },
              { "internalType": "uint256", "name": "fee", "type": "uint256" }
            ],
            "internalType": "struct TigerFlowRouter.VaultAllocation[]",
            "name": "allocations",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct TigerFlowRouter.RouteQuote",
        "name": "quote",
        "type": "tuple"
      },
      { "internalType": "uint256", "name": "uniswapOnlyWeth", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProtocolMetrics",
    "outputs": [
      { "internalType": "uint256", "name": "volume", "type": "uint256" },
      { "internalType": "uint256", "name": "trades", "type": "uint256" },
      { "internalType": "uint256", "name": "saved", "type": "uint256" },
      { "internalType": "uint256", "name": "vaultCount", "type": "uint256" },
      { "internalType": "uint256", "name": "totalLiquidity", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVaultCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isRegisteredVault",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "oracle",
    "outputs": [{ "internalType": "contract IPriceOracle", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "vault", "type": "address" }],
    "name": "registerVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address[]", "name": "vaults", "type": "address[]" }],
    "name": "registerVaultsBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "to", "type": "address" }],
    "name": "rescueETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "rescueTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "vault", "type": "address" }],
    "name": "removeVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_admin", "type": "address" }],
    "name": "setAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_oracle", "type": "address" }],
    "name": "setOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSlippageSaved",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalTradesExecuted",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVolumeProcessed",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "uniswapRouter",
    "outputs": [{ "internalType": "contract ISwapRouter", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "vaultList",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "weth",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  { "stateMutability": "payable", "type": "receive" }
] as const;
