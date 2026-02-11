import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TIGER_FLOW_ROUTER_ABI } from '../abis/TigerFlowRouter';
import { ERC20_ABI } from '../abis/ERC20';
import { ADDRESSES } from '../abis/addresses';
import { Settings, ChevronDown, ArrowUpDown, Zap, Fuel, Loader2, History } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionHistory } from './TransactionHistory';
import { RouteVisualizer } from './RouteVisualizer';
import { useTheme } from '../hooks/useTheme';
import { useEthPrice } from '../hooks/useEthPrice';

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const { isDark } = useTheme();
  useEthPrice(); // Fetch ETH price for other components
  const [usdcAmount, setUsdcAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [slippage, setSlippage] = useState('1.0');
  const [deadline, setDeadline] = useState('20');

  const { transactions, addTransaction, updateTransaction, clearHistory } = useTransactions(address);

  // Read balances
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: ADDRESSES.tokens.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: wethBalance, refetch: refetchWethBalance } = useReadContract({
    address: ADDRESSES.tokens.weth,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: ADDRESSES.tokens.usdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ADDRESSES.router] : undefined,
  });

  // Quote from router
  const { data: quoteData } = useReadContract({
    address: ADDRESSES.router,
    abi: TIGER_FLOW_ROUTER_ABI,
    functionName: 'getQuote',
    args: usdcAmount && parseFloat(usdcAmount) > 0 
      ? [parseUnits(usdcAmount, 6)] 
      : undefined,
  });

  const [tigerQuote] = quoteData || [null, 0n];

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
    const hash = approveHash || '0x' + Math.random().toString(16).slice(2);
    addTransaction({
      hash,
      type: 'approve',
      description: `Approve ${usdcAmount} USDC`,
      from: address,
      amount: usdcAmount,
    });
    approveUsdc({
      address: ADDRESSES.tokens.usdc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ADDRESSES.router, parseUnits(usdcAmount, 6)],
    });
  };

  const handleSwap = () => {
    if (!tigerQuote || !usdcAmount || !address) return;
    setIsSwapping(true);
    const hash = swapHash || '0x' + Math.random().toString(16).slice(2);
    addTransaction({
      hash,
      type: 'swap',
      description: `Swap ${usdcAmount} USDC for WETH`,
      from: address,
      to: ADDRESSES.router,
      amount: usdcAmount,
    });

    const deadlineMin = BigInt(Math.floor(Date.now() / 1000) + parseInt(deadline) * 60);
    const allocations = tigerQuote.allocations.map((a: any) => ({
      vault: a.vault,
      wethAmount: a.wethAmount,
      usdcCost: a.usdcCost,
      fee: a.fee,
    }));

    executeSwap({
      address: ADDRESSES.router,
      abi: TIGER_FLOW_ROUTER_ABI,
      functionName: 'executeSwap',
      args: [parseUnits(usdcAmount, 6), 0n, deadlineMin, allocations, BigInt(parseFloat(slippage) * 100)],
    });
  };

  const formatWeth = (amount: bigint) => {
    if (!amount) return '0.0000';
    return parseFloat(formatUnits(amount, 18)).toFixed(4);
  };

  const formatUsdc = (amount: bigint) => {
    if (!amount) return '0.00';
    return parseFloat(formatUnits(amount, 6)).toFixed(2);
  };

  // Calculate total fees
  const totalFees = tigerQuote?.allocations?.reduce((sum: bigint, a: any) => sum + a.fee, 0n) || 0n;

  return (
    <div className="w-full max-w-[480px] relative">
      {/* Main Card */}
      <div className={`relative rounded-3xl shadow-2xl overflow-hidden glass-panel border ${
        isDark 
          ? 'bg-[#2c2117] border-[#3d2e20]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6 sm:p-8 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Swap</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHistory(true)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-[#3d2e20] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <History size={18} />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-[#3d2e20] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* You Pay */}
          <div className={`input-express group rounded-2xl p-6 border border-transparent transition-all ${
            isDark ? 'bg-[#3d2e20]' : 'bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                You Pay
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
                  }
                }}
                className={`w-full bg-transparent border-none text-4xl sm:text-5xl font-display font-bold p-0 focus:ring-0 focus:outline-none placeholder-gray-300 dark:placeholder-gray-700 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              />
              <button className={`flex items-center space-x-2 px-4 py-2 rounded-2xl shadow-sm border transition-all hover:border-primary/50 ${
                isDark 
                  ? 'bg-[#2c2117] border-[#3d2e20]' 
                  : 'bg-white border-gray-200'
              }`}>
                <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-black">U</span>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>USDC</span>
                <ChevronDown size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              </button>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
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
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 bg-[#2c2117] hover:bg-[#3d2e20]' 
                      : 'text-gray-500 bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  50%
                </button>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="relative h-2 flex justify-center z-10">
            <button 
              onClick={() => {
                // Swap tokens logic could go here
              }}
              className={`group absolute -top-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 border-4 active:scale-95 ${
                isDark 
                  ? 'bg-[#2c2117] border-[#3d2e20] text-primary hover:bg-[#3d2e20]' 
                  : 'bg-white border-gray-50 text-primary hover:bg-gray-50'
              }`}
            >
              <ArrowUpDown size={20} className="font-bold transition-transform duration-300 group-hover:rotate-180" />
            </button>
          </div>

          {/* You Receive */}
          <div className={`input-express group rounded-2xl p-6 border border-transparent transition-all ${
            isDark ? 'bg-[#3d2e20]' : 'bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                You Receive
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Balance: {wethBalance ? formatWeth(wethBalance) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <input
                type="text"
                readOnly
                placeholder="0.0"
                value={tigerQuote ? formatWeth(tigerQuote.totalWethOut) : ''}
                className={`w-full bg-transparent border-none text-4xl sm:text-5xl font-display font-bold p-0 focus:ring-0 placeholder-gray-300 dark:placeholder-gray-700 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              />
              <button className={`flex items-center space-x-2 px-4 py-2 rounded-2xl shadow-sm border transition-all hover:border-primary/50 ${
                isDark 
                  ? 'bg-[#2c2117] border-[#3d2e20]' 
                  : 'bg-white border-gray-200'
              }`}>
                <span className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-[10px] text-white font-black">W</span>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>WETH</span>
                <ChevronDown size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              </button>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {tigerQuote && usdcAmount ? `~$${parseFloat(usdcAmount).toFixed(2)}` : '~$0.00'}
              </span>
              <span className="text-xs font-semibold text-green-500 flex items-center bg-green-500/10 px-2 py-1 rounded-lg">
                <Fuel size={12} className="mr-1" />
                $0.85
              </span>
            </div>
          </div>

          {/* Swap Button */}
          <div className="pt-4">
            {!isConnected ? (
              <button 
                disabled
                className="w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold py-5 rounded-2xl text-xl cursor-not-allowed"
              >
                Connect Wallet
              </button>
            ) : needsApproval() ? (
              <button 
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-orange-500/20 transition-all duration-300 transform active:scale-[0.98] text-xl flex items-center justify-center space-x-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <span>Approve USDC</span>
                )}
              </button>
            ) : (
              <button 
                onClick={handleSwap}
                disabled={isSwapping || !tigerQuote || !usdcAmount || parseFloat(usdcAmount) <= 0}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-orange-500/20 transition-all duration-300 transform active:scale-[0.98] text-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSwapping ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Swapping...</span>
                  </>
                ) : (
                  <>
                    <span>Swap Now</span>
                    <Zap size={20} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Route Details - Always show when quote available */}
          {tigerQuote && (
            <div className="pt-4 space-y-2">
              <div className={`flex justify-between items-center px-2 py-2 text-xs font-semibold ${
                isDark ? 'text-text-muted-dark' : 'text-text-muted-light'
              }`}>
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Optimal routing active
                </span>
              </div>
              
              <div className={`px-2 pb-2 space-y-2 border-t pt-3 ${
                isDark ? 'border-[#3d2e20]' : 'border-gray-100'
              }`}>
                <div className="flex justify-between text-[11px] font-medium">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Minimum received</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    {formatWeth(tigerQuote.totalWethOut * BigInt(99) / BigInt(100))} WETH
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-medium">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Price impact</span>
                  <span className="text-green-500">&lt; 0.01%</span>
                </div>
                <div className="flex justify-between text-[11px] font-medium">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Route fee</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    {totalFees > 0n ? `$${formatUnits(totalFees, 6)}` : '$0.00'}
                  </span>
                </div>

                {/* Route Visualizer - Always show */}
                {tigerQuote.allocations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#3d2e20]">
                    <RouteVisualizer 
                      isAnimating={true}
                      vaultCount={tigerQuote.allocations.length}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className={`w-full max-w-sm rounded-2xl p-6 ${
              isDark ? 'bg-[#2c2117] border border-[#3d2e20]' : 'bg-white border border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-[#3d2e20]' : 'hover:bg-gray-100'}`}
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Slippage Tolerance
                </label>
                <div className="flex gap-2 mt-2">
                  {['0.5', '1.0', '2.0'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        slippage === val
                          ? 'bg-primary text-white'
                          : isDark 
                            ? 'bg-surface-dark-2 text-gray-400 hover:bg-accent-dark' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Transaction Deadline
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      isDark 
                        ? 'bg-[#3d2e20] border-[#3d2e20] text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                  <span className={`text-sm font-medium ${isDark ? 'text-text-muted-dark' : 'text-gray-500'}`}>minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TransactionHistory 
        transactions={transactions}
        onClear={clearHistory}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
