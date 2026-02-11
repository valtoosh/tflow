# TigerFlow Demo Script - Complete Transaction Flow

## Pre-Demo Setup
1. Frontend running on http://localhost:3001
2. Mock data enabled (shows 3-source routing without wallet)
3. Screen recorder ready

## Demo Flow (2-3 minutes)

### Scene 1: Introduction (15 seconds)
- **Narration**: "TigerFlow is a multi-source DEX aggregator that combines RobinPump bonding curves, merchant vaults, and Uniswap V3 for optimal trade execution."
- **Visual**: Show landing page with TigerFlow branding

### Scene 2: Enter Trade Details (20 seconds)
- **Action**: Type "1000" in the "You Pay" field
- **Visual**: 
  - USDC amount: 1000
  - "You Receive" auto-calculates to ~0.25 WETH
  - Route visualizer appears with 3 sources
- **Narration**: "Let's swap 1,000 USDC for WETH. TigerFlow automatically calculates the optimal route."

### Scene 3: Show Route Optimization (30 seconds)
- **Visual**: Route visualizer shows:
  - RobinPump (50% - green)
  - Vault (30% - orange)
  - Uniswap (20% - blue)
- **Highlight**: 
  - "3 Sources" badge
  - "+RobinPump" tag
  - "+80% Optimized" indicator
  - Savings vs Uniswap: "Save 8% (0.02 WETH)"
- **Narration**: "Instead of going to Uniswap directly and getting 3.5% slippage, TigerFlow splits your trade across three sources. You save 8% compared to Uniswap-only."

### Scene 4: Connect Wallet (10 seconds)
- **Action**: Click "Connect Wallet" button
- **Visual**: RainbowKit modal appears
- **Narration**: "Connect your wallet to execute the trade."

### Scene 5: Execute Swap (30 seconds)
- **Action**: Click "Swap" button
- **Visual**:
  - Button changes to "Swapping..." with spinner
  - Route visualizer animates with traveling particles
  - Transaction appears in history
- **Narration**: "The trade executes across all three sources simultaneously. Watch the animated route show your trade flowing through RobinPump, vaults, and Uniswap."

### Scene 6: Success State (15 seconds)
- **Visual**:
  - "Success!" confirmation
  - Updated balances
  - Transaction in history with "success" status
- **Narration**: "Trade complete! You received 0.25 WETH with minimal slippage thanks to multi-source routing."

### Scene 7: Key Features Recap (20 seconds)
- **Visual**: Show key stats:
  - 4% max slippage hard cap
  - 60-80% savings vs Uniswap
  - MEV protection via commit-reveal
- **Narration**: "TigerFlow: Better prices through intelligent routing. Built on Base with RobinPump integration."

## Key Numbers to Highlight

| Metric | Value |
|--------|-------|
| Input | 1,000 USDC |
| Output | 0.25 WETH |
| Slippage | 1.5% (vs 3.5% on Uniswap) |
| Savings | 8% (0.02 WETH) |
| Sources | 3 (RobinPump + Vault + Uniswap) |
| Optimization | +80% |

## Technical Features to Mention
1. **4% Max Slippage**: Hard cap for protection
2. **Multi-Source Routing**: Splits trades automatically
3. **RobinPump Integration**: Access to bonding curve liquidity
4. **Vault Network**: Merchant-provided liquidity
5. **MEV Protection**: Commit-reveal mechanism

## Recording Tips
- Use 1080p resolution
- Zoom in on key UI elements
- Show mouse cursor for clarity
- Keep transitions smooth
- Add subtle background music if desired
