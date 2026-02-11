export const TIGER_FLOW_ROUTER_V2_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_usdc", "type": "address" },
      { "internalType": "address", "name": "_weth", "type": "address" },
      { "internalType": "address", "name": "_oracle", "type": "address" },
      { "internalType": "address", "name": "_uniswapRouter", "type": "address" },
      { "internalType": "address", "name": "_robinPumpAdapter", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "DeadlineExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ETHTransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAdapter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAllocation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidToken",
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
    "inputs": [],
    "name": "RobinPumpNotAvailable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SlippageExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SourceNotAuthorized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SwapFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TooManyAllocations",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TradeTooLarge",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TradeTooSmall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "VaultAlreadyRegistered",
    "type": "error"
  },
  {
    "inputs": [],
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
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "oldAdmin", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newAdmin", "type": "address" }
    ],
    "name": "AdminUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "ETHRescued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "oldOracle", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOracle", "type": "address" }
    ],
    "name": "OracleUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "oldAdapter", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newAdapter", "type": "address" }
    ],
    "name": "RobinPumpAdapterUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "enum TigerFlowRouterV2.SourceType", "name": "sourceType", "type": "uint8" },
      { "indexed": true, "internalType": "address", "name": "source", "type": "address" },
      { "indexed": false, "internalType": "bytes", "name": "reason", "type": "bytes" }
    ],
    "name": "SourceExecutionFailed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "enum TigerFlowRouterV2.SourceType", "name": "sourceType", "type": "uint8" },
      { "indexed": true, "internalType": "address", "name": "source", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "reason", "type": "string" }
    ],
    "name": "SourceSkipped",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "trader", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "usdcIn", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "tokensOut", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "robinPumpPortion", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "vaultPortion", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "uniswapPortion", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalFees", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "savings", "type": "uint256" }
    ],
    "name": "SwapExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "TokensRescued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "vault", "type": "address" }
    ],
    "name": "VaultRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "vault", "type": "address" }
    ],
    "name": "VaultRemoved",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_ALLOCATIONS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
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
    "name": "MAX_SLIPPAGE_BPS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_TRADE_SIZE",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_TRADE_SIZE",
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
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "usdcAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "minTokensOut", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      {
        "components": [
          { "internalType": "enum TigerFlowRouterV2.SourceType", "name": "sourceType", "type": "uint8" },
          { "internalType": "address", "name": "source", "type": "address" },
          { "internalType": "uint256", "name": "wethAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "usdcCost", "type": "uint256" },
          { "internalType": "uint256", "name": "fee", "type": "uint256" }
        ],
        "internalType": "struct TigerFlowRouterV2.SourceAllocation[]",
        "name": "expectedAllocations",
        "type": "tuple[]"
      }
    ],
    "name": "executeSwap",
    "outputs": [{ "internalType": "uint256", "name": "tokensOut", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveRobinPumpTokens",
    "outputs": [
      { "internalType": "address[]", "name": "tokens", "type": "address[]" },
      { "internalType": "uint256[]", "name": "prices", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "usdcAmount", "type": "uint256" }
    ],
    "name": "getQuote",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "totalWethOut", "type": "uint256" },
          { "internalType": "uint256", "name": "totalUsdcCost", "type": "uint256" },
          { "internalType": "uint256", "name": "robinPumpUsdcAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "robinPumpWethOut", "type": "uint256" },
          { "internalType": "uint256", "name": "vaultUsdcAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "vaultWethOut", "type": "uint256" },
          { "internalType": "uint256", "name": "uniswapUsdcAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "uniswapWethOut", "type": "uint256" },
          { "internalType": "uint256", "name": "totalFees", "type": "uint256" },
          { "internalType": "uint256", "name": "savingsVsUniswap", "type": "uint256" },
          {
            "components": [
              { "internalType": "enum TigerFlowRouterV2.SourceType", "name": "sourceType", "type": "uint8" },
              { "internalType": "address", "name": "source", "type": "address" },
              { "internalType": "uint256", "name": "wethAmount", "type": "uint256" },
              { "internalType": "uint256", "name": "usdcCost", "type": "uint256" },
              { "internalType": "uint256", "name": "fee", "type": "uint256" }
            ],
            "internalType": "struct TigerFlowRouterV2.SourceAllocation[]",
            "name": "allocations",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct TigerFlowRouterV2.RouteQuote",
        "name": "quote",
        "type": "tuple"
      },
      { "internalType": "uint256", "name": "uniswapOnlyWeth", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "usdcAmount", "type": "uint256" }
    ],
    "name": "getRobinPumpQuote",
    "outputs": [
      { "internalType": "uint256", "name": "tokensOut", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "name": "getRobinPumpStatus",
    "outputs": [
      { "internalType": "bool", "name": "available", "type": "bool" },
      { "internalType": "uint256", "name": "currentPrice", "type": "uint256" },
      { "internalType": "uint256", "name": "availableLiquidity", "type": "uint256" },
      { "internalType": "bool", "name": "isGraduated", "type": "bool" }
    ],
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
    "inputs": [
      { "internalType": "address", "name": "vault", "type": "address" }
    ],
    "name": "registerVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" }
    ],
    "name": "rescueETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" }
    ],
    "name": "rescueTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "vault", "type": "address" }
    ],
    "name": "removeVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "robinPumpAdapter",
    "outputs": [{ "internalType": "contract RobinPumpAdapter", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "robinPumpMaxSlippageBps",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "robinPumpVolume",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newAdmin", "type": "address" }
    ],
    "name": "setAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newOracle", "type": "address" }
    ],
    "name": "setOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_adapter", "type": "address" }
    ],
    "name": "setRobinPumpAdapter",
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
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
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
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;

export const TIGER_FLOW_ROUTER_V2_ADDRESS = {
  baseSepolia: '0x...', // To be deployed
} as const;
