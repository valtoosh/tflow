# TigerFlow - Base-Native Execution Layer for Large Trades

Production-ready smart contracts for routing large USDC→ETH trades through merchant WETH vaults on Base, reducing slippage by 60-80% compared to Uniswap-only execution.

## Features

- **Trader-Focused**: Execute $50k-500k trades with minimal slippage
- **Merchant Vaults**: Earn yield on idle WETH by providing liquidity
- **MEV Protection**: Commitment pattern prevents front-running
- **Security Hardened**: Immutable router, try-catch resilience, comprehensive access control
- **Base-Native**: Optimized for Base with Chainlink oracles and Uniswap V3 integration

## Contracts

- **TigerFlowRouter.sol**: Intelligent routing engine that splits trades across vaults + Uniswap
- **LiquidityVault.sol**: Non-custodial WETH vaults with configurable fees and utilization limits
- **TigerFlowOracle.sol**: Chainlink ETH/USD price feed wrapper with staleness checks

## Test Coverage

- 57/57 tests passing
- 93% statement coverage, 93% line coverage
- Gas benchmarks: deposit 84k, withdraw 45k, executeSwap 485k-548k

## Security Features

- Immutable router (prevents owner from changing execution logic)
- Commitment pattern with MEV protection
- Try-catch resilience (vault failures don't brick system)
- ReentrancyGuard on all state-changing functions
- Pausable emergency mechanism
- ETH rescue functions
- Comprehensive input validation

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployment

```bash
# Copy .env.example to .env and fill in your values
cp .env.example .env

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Verify on BaseScan (requires BASESCAN_API_KEY in .env)
```

## Architecture

```
Trader → Router → [Vault 1, Vault 2, Vault 3, Uniswap V3]
         ↓
      Optimal Split (sorted by lowest fee)
         ↓
      USDC → Vaults (payment)
      WETH ← Vaults (to trader)
```

## License

MIT
