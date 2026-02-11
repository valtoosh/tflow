# 📹 Video Upload Guide for Hackathon Submission

## Step 1: Upload Demo Video to YouTube

### Option A: YouTube (Recommended for demo video)

1. **Go to YouTube Studio**: https://studio.youtube.com
2. **Click "CREATE" → "Upload videos"**
3. **Select your demo video file**
4. **Fill in details:**
   - Title: `TigerFlow - Multi-Source DEX Aggregator on Base | EasyA Consensus Hackathon`
   - Description:
     ```
     TigerFlow aggregates RobinPump bonding curves, merchant WETH vaults, and Uniswap V3 
     to minimize slippage on large trades.

     Built for EasyA Consensus Hackathon (Hong Kong)
     
     🔗 GitHub: https://github.com/valtoosh/tflow
     🌐 Live Demo: [Your deployed URL]
     
     Features:
     - RobinPump bonding curve integration
     - Merchant liquidity vaults (12-18% APY)
     - Multi-source routing
     - MEV protection
     - 60-80% slippage reduction
     ```
   - Visibility: **Public** or **Unlisted** (judges can still view)
   - Thumbnail: Use a screenshot from your demo

5. **After upload, get the video ID:**
   - URL will be: `https://youtu.be/ABC123XYZ`
   - Video ID is: `ABC123XYZ`

6. **Update README.md:**
   ```bash
   # Replace YOUR_VIDEO_ID with ABC123XYZ
   sed -i '' 's/YOUR_VIDEO_ID/ABC123XYZ/g' README.md
   ```

---

## Step 2: Record Loom Walkthrough Video

### Requirements (from hackathon rules):
- **Audio required** (explain as you go)
- **Show code structure** (GitHub repo tour)
- **Demo everything working** (run the app)
- **Explain how you satisfied requirements** (RobinPump integration, etc.)

### Recording Steps:

1. **Install Loom**: https://www.loom.com/download
2. **Start recording** (Screen + Webcam recommended)
3. **Script outline** (5-7 minutes total):

   **0:00-0:30** - Introduction
   ```
   "Hi, I'm [Name] and this is TigerFlow, a multi-source DEX aggregator 
   built for the EasyA Consensus Hackathon. Let me show you how it works."
   ```

   **0:30-1:30** - GitHub Repo Structure
   ```
   "Here's our GitHub repo. The project is organized into:
   - /contracts - Solidity smart contracts (RouterV2, RobinPumpAdapter, Vaults)
   - /frontend - React app with Wagmi and RainbowKit
   - /test - 57 passing tests with 93% coverage
   - /docs - Screenshots and documentation"
   ```

   **1:30-3:00** - Smart Contract Walkthrough
   ```
   "Let's look at the key contracts:
   
   1. TigerFlowRouterV2.sol - The main routing engine
      - Line 192: getRobinPumpStatus() checks if token is on RobinPump
      - Line 281: getQuote() calculates optimal route across 3 sources
      - Line 454: executeSwap() executes the multi-source trade
   
   2. RobinPumpAdapter.sol - Bridges to RobinPump
      - Line 112: getBuyQuote() gets bonding curve price
      - Line 122: executeBuy() executes through RobinPump pool
   
   3. LiquidityVault.sol - Merchant WETH vaults
      - Non-custodial, merchants keep full control
      - 0.10-0.15% fees, 12-18% APY"
   ```

   **3:00-4:30** - Frontend Demo
   ```
   "Now let's see it in action:
   
   1. Connect wallet (MetaMask/Coinbase)
   2. Enter 1000 USDC
   3. See the route: 30% RobinPump + 40% Vault + 30% Uniswap
   4. Rate shows 1 USDC ≈ 0.000312 WETH (real-time from CoinGecko)
   5. Execute swap - success modal shows exact amount received
   6. Transaction history tracks everything
   7. Vaults page shows 12-18% APY for liquidity providers"
   ```

   **4:30-5:30** - Hackathon Requirements
   ```
   "How we satisfied the requirements:
   
   ✅ Built on Base - All contracts deployed to Base Sepolia
   ✅ RobinPump integration - RobinPumpAdapter contract interfaces with their factory
   ✅ Open source - github.com/valtoosh/tflow
   ✅ Demo mode - Zero-cost testing without gas fees
   ✅ Security - ReentrancyGuard, 4% slippage cap, MEV protection
   
   The key innovation is multi-source routing - we're the first to combine
   RobinPump bonding curves with merchant vaults and Uniswap for optimal execution."
   ```

   **5:30-6:00** - Wrap up
   ```
   "Thanks for watching! Check out the GitHub repo for full documentation,
   test coverage, and deployment addresses. Built with 🐯 for Base."
   ```

4. **After recording:**
   - Loom will give you a share link: `https://www.loom.com/share/abc123def456`
   - Copy the ID: `abc123def456`

5. **Update README.md:**
   ```bash
   sed -i '' 's/YOUR_LOOM_ID/abc123def456/g' README.md
   ```

---

## Step 3: Create Canva Presentation

### Required Slides:

1. **Title Slide**
   - Project name: TigerFlow
   - Tagline: "Multi-Source DEX Aggregator on Base"
   - Your name/team

2. **Team Slide**
   - Photo (optional)
   - Name, role
   - LinkedIn/Twitter

3. **Problem Slide**
   - Large trades suffer 2-5% slippage on Uniswap
   - MEV attacks extract value
   - Limited liquidity depth

4. **Solution Slide**
   - Multi-source routing (RobinPump + Vaults + Uniswap)
   - 60-80% slippage reduction
   - MEV protection via commit-reveal

5. **Technology Slide**
   - Base L2 (low gas, high speed)
   - RobinPump bonding curves
   - Merchant liquidity vaults
   - Uniswap V3 fallback

6. **Demo Screenshots Slide**
   - 2-3 key screenshots from your demo
   - Highlight the route visualization

7. **Future Roadmap Slide**
   - Multi-token support (WBTC, cbETH)
   - Limit orders
   - Cross-chain liquidity
   - Mobile app

### Steps:

1. **Go to Canva**: https://www.canva.com
2. **Create presentation** (16:9 format)
3. **Use template** or start from scratch
4. **Add slides** (7-10 slides total)
5. **Export as PDF** and **Share link**
6. **Get share link:**
   - Click "Share" → "Anyone with the link can view"
   - Copy link: `https://www.canva.com/design/DAFxyz123/view`
   - Design ID is: `DAFxyz123`

7. **Update README.md:**
   ```bash
   sed -i '' 's/YOUR_DESIGN_ID/DAFxyz123/g' README.md
   ```

---

## Step 4: Final Checklist

After uploading all videos and creating Canva:

```bash
# Update README with all IDs
git add README.md
git commit -m "docs: add demo video, Loom walkthrough, and Canva links"
git push

# Verify all links work
# - YouTube demo video
# - Loom walkthrough
# - Canva presentation
# - All screenshots display correctly
```

### Hackathon Submission Form

When filling out the Google Form:

1. **Project Name**: TigerFlow
2. **Short Summary**: (Copy from README line 7)
3. **GitHub URL**: https://github.com/valtoosh/tflow
4. **Demo Video**: [Your YouTube link]
5. **Loom Video**: [Your Loom link]
6. **Canva Slides**: [Your Canva link]
7. **Deployed Contract**: `0x49ca4100912D413dA17C6B550bf124F5cEBEbC10` (Base Sepolia)
8. **Team Members**: [Your name]

---

## Tips for Great Videos

### Demo Video (2-3 minutes):
- ✅ Show the problem (Uniswap slippage)
- ✅ Show TigerFlow solution (multi-source routing)
- ✅ Execute a swap end-to-end
- ✅ Highlight unique features (RobinPump integration, route viz)
- ✅ Keep it fast-paced and engaging

### Loom Walkthrough (5-7 minutes):
- ✅ Speak clearly with enthusiasm
- ✅ Show code AND demo
- ✅ Explain technical decisions
- ✅ Highlight security features
- ✅ Mention test coverage (93%)
- ✅ Edit out long pauses (Loom has built-in trimming)

### Canva Presentation:
- ✅ Use high-quality screenshots
- ✅ Keep text minimal (bullet points)
- ✅ Use consistent branding (tiger theme, orange/purple colors)
- ✅ Include metrics (60-80% slippage reduction, 12-18% APY)

---

## Need Help?

If you get stuck:
1. Check example README: https://github.com/mahir-pa/poap
2. Watch example Loom: https://youtu.be/ZLKR4zE1o6U
3. DM me or ask in hackathon Discord

Good luck! 🐯🚀
