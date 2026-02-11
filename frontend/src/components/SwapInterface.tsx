import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TIGER_FLOW_ROUTER_V2_ABI, TIGER_FLOW_ROUTER_V2_ADDRESS } from '../abis/TigerFlowRouterV2';
import { ERC20_ABI } from '../abis/ERC20';
import { ADDRESSES } from '../abis/addresses';
import { Settings, ChevronDown, ArrowUpDown, Zap, Fuel, Loader2, History, TrendingUp } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionHistory } from './TransactionHistory';
import { RouteVisualizer } from './RouteVisualizer';
import { RobinPumpTokens } from './RobinPumpTokens';
import { useTheme } from '../hooks/useTheme';
import { useEthPrice } from '../hooks/useEthPrice';
import { useOptimalRoute, useRobinPumpStatus, getRobinPumpErrorMessage } from '../hooks/useRobinPump';
import { useDemoMode } from '../hooks/useDemoMode';
import { SwapSuccessModal } from './SwapSuccessModal';

interface RobinPumpToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  timeSinceLaunch: string;
  isHot: boolean;
}

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const { isDark } = useTheme();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  useEthPrice();
  
  // Token selection - now supports RobinPump tokens
  const [selectedToken, setSelectedToken] = useState<RobinPumpToken | null>(null);
  const [isWethSelected, setIsWethSelected] = useState(true);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  
  const [usdcAmount, setUsdcAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [slippage] = useState('1.0');
  const [deadline] = useState('20');
  const [swapError, setSwapError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTxHash, setLastTxHash] = useState('');
  const [completedSwap, setCompletedSwap] = useState<{amount: string; output: string; route: typeof routeSources} | null>(null);

  const { transactions, addTransaction, updateTransaction, clearHistory } = useTransactions(address);

  // Determine which token we're buying
  const targetToken = isWethSelected ? ADDRESSES.tokens.weth : (selectedToken?.address || ADDRESSES.tokens.weth);
  
  // Check if token is on RobinPump
  const { hasActivePool: isRobinPumpToken } = useRobinPumpStatus(targetToken);
  
  // Get optimal route across all sources
  const { route, uniswapOnly, isLoading: routeLoading } = useOptimalRoute(
    targetToken,
    usdcAmount
  );

  // Read balances
  const { data: realUsdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: ADDRESSES.tokens.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: realWethBalance, refetch: refetchWethBalance } = useReadContract({
    address: ADDRESSES.tokens.weth,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: realUsdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: ADDRESSES.tokens.usdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ADDRESSES.router] : undefined,
  });

  // Demo mode: show realistic mock balances
  const DEMO_USDC_BALANCE = 5000000000n; // 5,000 USDC
  const DEMO_WETH_BALANCE = 2500000000000000000n; // 2.5 WETH
  const DEMO_ALLOWANCE = 100000000000n; // 100,000 USDC allowance

  const usdcBalance = isDemoMode && isConnected ? DEMO_USDC_BALANCE : realUsdcBalance;
  const wethBalance = isDemoMode && isConnected ? DEMO_WETH_BALANCE : realWethBalance;
  const usdcAllowance = isDemoMode && isConnected ? DEMO_ALLOWANCE : realUsdcAllowance;

  // Write contracts
  const { writeContract: approveUsdc, data: approveHash } = useWriteContract();
  const { writeContract: executeSwap, data: swapHash } = useWriteContract();

  const { isSuccess: approveSuccess, isError: approveFailed } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: swapSuccess, isError: swapFailed } = useWaitForTransactionReceipt({ hash: swapHash });

  // Handle transaction status
  useEffect(() => {
    if (approveHash) {
      if (approveSuccess) {
        setIsApproving(false);
        refetchAllowance();
        updateTransaction(approveHash, { status: 'success' });
      } else if (approveFailed) {
        setIsApproving(false);
        updateTransaction(approveHash, { status: 'failed' });
      }
    }
  }, [approveSuccess, approveFailed, approveHash, refetchAllowance, updateTransaction]);

  useEffect(() => {
    if (swapHash) {
      if (swapSuccess) {
        setIsSwapping(false);
        setUsdcAmount('');
        refetchUsdcBalance();
        refetchWethBalance();
        updateTransaction(swapHash, { status: 'success' });
      } else if (swapFailed) {
        setIsSwapping(false);
        updateTransaction(swapHash, { status: 'failed' });
      }
    }
  }, [swapSuccess, swapFailed, swapHash, refetchUsdcBalance, refetchWethBalance, updateTransaction]);

  const needsApproval = () => {
    if (!usdcAmount || !usdcAllowance) return false;
    return usdcAllowance < parseUnits(usdcAmount, 6);
  };

  const handleApprove = () => {
    if (!usdcAmount || !address) return;
    setIsApproving(true);
    setSwapError(null);
    
    const hash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    addTransaction({
      hash,
      type: 'approve',
      description: `Approve ${usdcAmount} USDC`,
      from: address,
      amount: usdcAmount,
    });
    
    // Demo mode: simulate successful approval
    if (isDemoMode) {
      setTimeout(() => {
        setIsApproving(false);
        updateTransaction(hash, { status: 'success' });
      }, 2000);
      return;
    }
    
    approveUsdc({
      address: ADDRESSES.tokens.usdc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ADDRESSES.router, parseUnits(usdcAmount, 6)],
    });
  };

  const handleSwap = () => {
    if (!route || !usdcAmount || !address) return;
    setIsSwapping(true);
    setSwapError(null);
    
    const hash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    addTransaction({
      hash,
      type: 'swap',
      description: `Swap ${usdcAmount} USDC for ${isWethSelected ? 'WETH' : selectedToken?.symbol}`,
      from: address,
      to: ADDRESSES.router,
      amount: usdcAmount,
    });

    // Demo mode: simulate successful swap without blockchain call
    if (isDemoMode) {
      setLastTxHash(hash);
      // Store swap details before clearing
      setCompletedSwap({
        amount: usdcAmount,
        output: route ? formatUnits(route.totalWethOut, 18) : '0',
        route: routeSources,
      });
      setTimeout(() => {
        setIsSwapping(false);
        setUsdcAmount('');
        updateTransaction(hash, { status: 'success' });
        setShowSuccessModal(true);
      }, 2500); // 2.5 second simulated transaction
      return;
    }

    try {
      executeSwap({
        address: TIGER_FLOW_ROUTER_V2_ADDRESS.baseSepolia,
        abi: TIGER_FLOW_ROUTER_V2_ABI,
        functionName: 'executeSwap',
        args: [
          targetToken as `0x${string}`,
          parseUnits(usdcAmount, 6),
          route.totalWethOut * BigInt(95) / BigInt(100), // 5% slippage protection
          BigInt(Math.floor(Date.now() / 1000) + parseInt(deadline) * 60),
          route.allocations,
        ],
      });
    } catch (err) {
      setIsSwapping(false);
      setSwapError(getRobinPumpErrorMessage(err instanceof Error ? err : null));
    }
  };

  const formatWeth = (amount: bigint) => {
    if (!amount) return '0.0000';
    return parseFloat(formatUnits(amount, 18)).toFixed(4);
  };

  const formatUsdc = (amount: bigint) => {
    if (!amount) return '0.00';
    return parseFloat(formatUnits(amount, 6)).toFixed(2);
  };

  // Calculate savings vs Uniswap
  const savings = route && uniswapOnly ? Number(uniswapOnly) - Number(route.totalWethOut) : 0;
  const savingsPercent = route && uniswapOnly ? (savings / Number(uniswapOnly)) * 100 : 0;

  // Determine route sources for visualizer
  const routeSources: Array<{type: 'robinpump' | 'vault' | 'uniswap', percentage: number, name: string}> = route?.allocations?.map((alloc: any) => ({
    type: alloc.sourceType === 0 ? 'robinpump' : alloc.sourceType === 1 ? 'vault' : 'uniswap',
    percentage: Number(alloc.usdcCost) / Number(parseUnits(usdcAmount || '0', 6)) * 100,
    name: alloc.sourceType === 0 ? 'RobinPump' : alloc.sourceType === 1 ? 'Vault' : 'Uniswap V3',
  })) || [];

  return (
    <div className="w-full max-w-[480px] relative">
      {/* Main Card */}
      <div 
        className="relative rounded-3xl shadow-2xl overflow-hidden glass-panel border"
        style={{
          backgroundColor: isDark ? '#2c2117' : '#ffffff',
          borderColor: isDark ? '#3d2e20' : '#e5e7eb'
        }}
      >
        <div className="p-6 sm:p-8 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span 
                className="font-semibold text-lg"
                style={{ color: isDark ? '#ffffff' : '#111827' }}
              >
                Swap
              </span>
              {/* Demo Mode Toggle */}
              <button
                onClick={toggleDemoMode}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                  isDemoMode 
                    ? 'bg-amber-500/20 text-amber-600 border-amber-500/30' 
                    : 'bg-green-500/20 text-green-600 border-green-500/30'
                }`}
                title={isDemoMode ? "Click to use real contract data" : "Click to use demo data"}
              >
                {isDemoMode ? 'DEMO' : 'LIVE'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-xl transition-colors"
                style={{ 
                  color: isDark ? '#9ca3af' : '#6b7280',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#3d2e20' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <History size={18} />
              </button>
              <button 
                onClick={() => {}}
                className="p-2 rounded-xl transition-colors"
                style={{ 
                  color: isDark ? '#9ca3af' : '#6b7280',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#3d2e20' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* You Pay */}
          <div 
            className="group rounded-2xl p-6 border border-transparent transition-all"
            style={{ backgroundColor: isDark ? '#3d2e20' : '#f9fafb' }}
          >
            <div className="flex justify-between items-center mb-4">
              <span 
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              >
                You Pay
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
              >
                Balance: {usdcBalance ? formatUsdc(usdcBalance) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={usdcAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setUsdcAmount(val);
                    setSwapError(null);
                  }
                }}
                className="w-full bg-transparent border-none text-4xl sm:text-5xl font-display font-bold p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                style={{ color: isDark ? '#ffffff' : '#111827' }}
              />
              <button 
                className="flex items-center space-x-2 px-4 py-2 rounded-2xl shadow-sm border transition-all hover:border-primary/50"
                style={{
                  backgroundColor: isDark ? '#2c2117' : '#ffffff',
                  borderColor: isDark ? '#3d2e20' : '#e5e7eb'
                }}
              >
                <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-black">U</span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: isDark ? '#ffffff' : '#111827' }}
                >
                  USDC
                </span>
              </button>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span 
                className="text-sm"
                style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
              >
                ~${usdcAmount || '0.00'}
              </span>
              <div className="flex space-x-1.5">
                <button 
                  onClick={() => usdcBalance && setUsdcAmount(formatUnits(usdcBalance, 6))}
                  className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
                >
                  MAX
                </button>
                <button 
                  onClick={() => usdcBalance && setUsdcAmount((Number(formatUnits(usdcBalance, 6)) / 2).toString())}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isDark ? '#2c2117' : '#e5e7eb',
                    color: isDark ? '#9ca3af' : '#6b7280'
                  }}
                >
                  50%
                </button>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="relative h-2 flex justify-center z-10">
            <button 
              onClick={() => setShowTokenSelector(!showTokenSelector)}
              className="group absolute -top-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 border-4 active:scale-95"
              style={{
                backgroundColor: isDark ? '#2c2117' : '#ffffff',
                borderColor: isDark ? '#3d2e20' : '#f9fafb',
                color: '#F2541B'
              }}
            >
              <ArrowUpDown size={20} className="font-bold transition-transform duration-300 group-hover:rotate-180" />
            </button>
          </div>

          {/* You Receive */}
          <div 
            className="group rounded-2xl p-6 border border-transparent transition-all"
            style={{ backgroundColor: isDark ? '#3d2e20' : '#f9fafb' }}
          >
            <div className="flex justify-between items-center mb-4">
              <span 
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              >
                You Receive
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
              >
                Balance: {wethBalance ? formatWeth(wethBalance) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <input
                type="text"
                readOnly
                placeholder="0.0"
                value={route ? formatWeth(route.totalWethOut) : ''}
                className="w-full bg-transparent border-none text-4xl sm:text-5xl font-display font-bold p-0 focus:ring-0 placeholder-gray-300"
                style={{ color: isDark ? '#ffffff' : '#111827' }}
              />
              <button 
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                className="flex items-center space-x-2 px-4 py-2 rounded-2xl shadow-sm border transition-all hover:border-primary/50"
                style={{
                  backgroundColor: isDark ? '#2c2117' : '#ffffff',
                  borderColor: isDark ? '#3d2e20' : '#e5e7eb'
                }}
              >
                <span 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                  style={{ 
                    background: isWethSelected 
                      ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' 
                      : 'linear-gradient(135deg, #F2541B 0%, #ff6b35 100%)' 
                  }}
                >
                  {isWethSelected ? 'W' : selectedToken?.symbol?.[0] || '?'}
                </span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: isDark ? '#ffffff' : '#111827' }}
                >
                  {isWethSelected ? 'WETH' : selectedToken?.symbol || 'Select'}
                </span>
                <ChevronDown size={16} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
              </button>
            </div>
            
            {/* Token Selector Dropdown */}
            {showTokenSelector && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    setIsWethSelected(true);
                    setSelectedToken(null);
                    setShowTokenSelector(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{
                    backgroundColor: isWethSelected 
                      ? (isDark ? 'rgba(242, 84, 27, 0.1)' : 'rgba(242, 84, 27, 0.05)')
                      : 'transparent'
                  }}
                >
                  <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-[10px] text-white font-black">W</span>
                  <div className="text-left">
                    <p className="font-bold" style={{ color: isDark ? '#ffffff' : '#111827' }}>WETH</p>
                    <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Wrapped Ether</p>
                  </div>
                </button>
                
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: isDark ? '#2c2117' : '#f3f4f6' }}
                >
                  <p 
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                  >
                    <TrendingUp size={12} className="inline mr-1" />
                    RobinPump Tokens
                  </p>
                  <RobinPumpTokens
                    onSelectToken={(token) => {
                      setSelectedToken(token);
                      setIsWethSelected(false);
                      setShowTokenSelector(false);
                    }}
                    selectedToken={selectedToken || undefined}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <span 
                className="text-sm"
                style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
              >
                {route && usdcAmount ? `~$${parseFloat(usdcAmount).toFixed(2)}` : '~$0.00'}
              </span>
              {isRobinPumpToken && (
                <span 
                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(242, 84, 27, 0.2)' : 'rgba(242, 84, 27, 0.1)',
                    color: '#F2541B'
                  }}
                >
                  <TrendingUp size={10} className="inline mr-1" />
                  RobinPump
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {swapError && (
            <div 
              className="p-3 rounded-xl text-sm"
              style={{ 
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                color: '#ef4444'
              }}
            >
              {swapError}
            </div>
          )}

          {/* Route Details */}
          {route && usdcAmount && (
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Rate</span>
                <span style={{ color: isDark ? '#ffffff' : '#111827' }}>
                  1 USDC ≈ {(Number(route.totalWethOut) / Number(parseUnits(usdcAmount, 6))).toFixed(6)} {isWethSelected ? 'WETH' : selectedToken?.symbol}
                </span>
              </div>
              
              {savings > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>vs Uniswap</span>
                  <span className="text-green-500 font-medium">
                    Save {savingsPercent.toFixed(2)}% ({formatWeth(BigInt(Math.floor(savings)))} {isWethSelected ? 'WETH' : selectedToken?.symbol})
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Max Slippage</span>
                <span style={{ color: isDark ? '#ffffff' : '#111827' }}>{slippage}%</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Network Fee</span>
                <span className="flex items-center" style={{ color: isDark ? '#ffffff' : '#111827' }}>
                  <Fuel size={12} className="mr-1" />
                  ~$0.85
                </span>
              </div>
              
              {/* Route Visualizer */}
              <RouteVisualizer 
                sources={routeSources}
                isAnimating={isSwapping}
              />
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={needsApproval() ? handleApprove : handleSwap}
            disabled={!isConnected || !usdcAmount || parseFloat(usdcAmount) <= 0 || isApproving || isSwapping || routeLoading}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #F2541B 0%, #D9420D 100%)',
              boxShadow: '0 4px 20px -5px rgba(242, 84, 27, 0.4)'
            }}
          >
            {!isConnected ? (
              'Connect Wallet'
            ) : isApproving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Approving...
              </span>
            ) : isSwapping ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Swapping...
              </span>
            ) : routeLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Getting Best Price...
              </span>
            ) : needsApproval() ? (
              'Approve USDC'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap size={20} />
                {isRobinPumpToken ? 'Buy on RobinPump' : 'Swap'}
              </span>
            )}
          </button>
        </div>
      </div>

      <TransactionHistory 
        transactions={transactions}
        onClear={clearHistory}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <SwapSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        fromAmount={completedSwap?.amount || usdcAmount}
        fromToken="USDC"
        toAmount={completedSwap?.output || (route ? formatUnits(route.totalWethOut, 18) : '0')}
        toToken={isWethSelected ? 'WETH' : selectedToken?.symbol || 'WETH'}
        txHash={lastTxHash}
        route={completedSwap?.route || routeSources}
      />
    </div>
  );
}
