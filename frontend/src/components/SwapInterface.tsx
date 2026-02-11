import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TIGER_FLOW_ROUTER_ABI } from '../abis/TigerFlowRouter';
import { ERC20_ABI } from '../abis/ERC20';
import { ADDRESSES } from '../abis/addresses';
import { ChevronDown, ArrowDown, Settings, Check, X, History, Loader2, RefreshCw } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionHistory } from './TransactionHistory';

// Spotlight hook
function useSpotlight(ref: React.RefObject<HTMLElement>) {
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--mouse-x', `${x}px`);
    ref.current.style.setProperty('--mouse-y', `${y}px`);
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, [ref, handleMouseMove]);
}

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const [usdcAmount, setUsdcAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [slippage, setSlippage] = useState('1.0');
  const [deadline, setDeadline] = useState('20');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { transactions, addTransaction, updateTransaction, clearHistory } = useTransactions(address);
  const cardRef = useRef<HTMLDivElement>(null);
  useSpotlight(cardRef);

  // Read balances and allowances
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: ADDRESSES.tokens.usdc,
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

  // Quote with refetch for real-time updates
  const { data: quoteData, refetch: refetchQuote } = useReadContract({
    address: ADDRESSES.router,
    abi: TIGER_FLOW_ROUTER_ABI,
    functionName: 'getQuote',
    args: usdcAmount && parseFloat(usdcAmount) > 0 
      ? [parseUnits(usdcAmount, 6)] 
      : undefined,
  });

  const [tigerQuote, uniswapOnlyWeth] = quoteData || [null, 0n];

  // Auto-refresh quote every 30 seconds
  useEffect(() => {
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) return;
    
    const interval = setInterval(() => {
      refetchQuote();
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [usdcAmount, refetchQuote]);

  // Write contracts
  const { writeContract: approveUsdc, data: approveHash, error: approveError } = useWriteContract();
  const { writeContract: executeSwap, data: swapHash, error: swapError } = useWriteContract();

  const { isSuccess: approveSuccess, isError: approveFailed } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: swapSuccess, isError: swapFailed } = useWaitForTransactionReceipt({ hash: swapHash });

  // Handle transaction status updates
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
        updateTransaction(swapHash, { status: 'success' });
      } else if (swapFailed) {
        setIsSwapping(false);
        updateTransaction(swapHash, { status: 'failed' });
      }
    }
  }, [swapSuccess, swapFailed, swapHash, refetchUsdcBalance, updateTransaction]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      setIsApproving(false);
      alert(`Approval failed: ${approveError.message}`);
    }
  }, [approveError]);

  useEffect(() => {
    if (swapError) {
      setIsSwapping(false);
      alert(`Swap failed: ${swapError.message}`);
    }
  }, [swapError]);

  const needsApproval = () => {
    if (!usdcAmount || !usdcAllowance) return false;
    return usdcAllowance < parseUnits(usdcAmount, 6);
  };

  const handleApprove = () => {
    if (!usdcAmount) return;
    setIsApproving(true);
    
    addTransaction({
      hash: '',
      type: 'approve',
      description: `Approve USDC for swapping`,
      from: address!,
    });

    approveUsdc({
      address: ADDRESSES.tokens.usdc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ADDRESSES.router, parseUnits(usdcAmount, 6)],
    }, {
      onSuccess: (hash) => {
        updateTransaction('', { hash });
      },
    });
  };

  const handleSwap = () => {
    if (!tigerQuote || !usdcAmount) return;
    setIsSwapping(true);

    const deadlineMin = BigInt(Math.floor(Date.now() / 1000) + parseInt(deadline) * 60);
    const allocations = tigerQuote.allocations.map((a: any) => ({
      vault: a.vault,
      wethAmount: a.wethAmount,
      usdcCost: a.usdcCost,
      fee: a.fee,
    }));

    addTransaction({
      hash: '',
      type: 'swap',
      description: `Swap ${usdcAmount} USDC for WETH`,
      from: address!,
      amount: usdcAmount,
    });

    executeSwap({
      address: ADDRESSES.router,
      abi: TIGER_FLOW_ROUTER_ABI,
      functionName: 'executeSwap',
      args: [parseUnits(usdcAmount, 6), 0n, deadlineMin, allocations, BigInt(parseFloat(slippage) * 100)],
    }, {
      onSuccess: (hash) => {
        updateTransaction('', { hash });
      },
    });
  };

  const formatWeth = (amount: bigint) => {
    if (!amount) return '0.000000';
    return parseFloat(formatUnits(amount, 18)).toFixed(6);
  };

  const savingsPercent = () => {
    if (!tigerQuote || !uniswapOnlyWeth || uniswapOnlyWeth === 0n) return 0;
    const tigerOut = Number(formatUnits(tigerQuote.totalWethOut, 18));
    const uniOut = Number(formatUnits(uniswapOnlyWeth, 18));
    return ((tigerOut - uniOut) / uniOut * 100).toFixed(2);
  };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto' }}>
      <div ref={cardRef} className="card" style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>Swap</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="icon-btn"
              onClick={() => setShowHistory(true)}
              style={{ position: 'relative' }}
            >
              <History size={18} />
              {transactions.filter(t => t.status === 'pending').length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  background: '#ff6b35',
                  borderRadius: '50%',
                }} />
              )}
            </button>
            <button 
              className="icon-btn"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* From */}
        <div style={{ background: '#11141a', border: '1px solid #2a333c', borderRadius: '12px', padding: '16px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
            <span>Sell</span>
            <span>Balance: {usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)).toFixed(4) : '0.0000'}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={usdcAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setUsdcAmount(val);
                  if (val && parseFloat(val) > 0) {
                    setTimeout(() => refetchQuote(), 100);
                  }
                }
              }}
              className="input"
              style={{ flex: 1, fontSize: '28px', padding: 0 }}
            />
            <button className="token-btn">
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>U</div>
              <span>USDC</span>
              <ChevronDown size={16} style={{ color: '#6b7280' }} />
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '14px' }}>
            <span style={{ color: '#6b7280' }}>${usdcAmount || '0.00'}</span>
            <button 
              onClick={() => usdcBalance && setUsdcAmount(formatUnits(usdcBalance, 6))}
              style={{ fontSize: '12px', fontWeight: 600, color: '#ff6b35', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div className="swap-btn">
          <ArrowDown size={18} style={{ color: '#9ca3af' }} />
        </div>

        {/* To */}
        <div style={{ background: '#11141a', border: '1px solid #2a333c', borderRadius: '12px', padding: '16px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
            <span>Buy</span>
            {lastUpdated && (
              <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={10} />
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text"
              placeholder="0"
              readOnly
              value={tigerQuote ? formatWeth(tigerQuote.totalWethOut) : ''}
              className="input"
              style={{ flex: 1, fontSize: '28px', padding: 0 }}
            />
            <button className="token-btn">
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>W</div>
              <span>WETH</span>
              <ChevronDown size={16} style={{ color: '#6b7280' }} />
            </button>
          </div>
          
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
            {tigerQuote ? `~$${(parseFloat(formatUnits(tigerQuote.totalWethOut, 18)) * 2000).toFixed(2)}` : '~$0.00'}
          </div>
        </div>

        {/* Routes */}
        {tigerQuote && uniswapOnlyWeth > 0n && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* TigerFlow */}
            <div className="route-option active">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/tiger-logo.svg" alt="" style={{ width: '32px', height: '32px' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 500 }}>TigerFlow</span>
                      <span className="badge badge-success">
                        <Check size={10} />
                        Best
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {tigerQuote.allocations.length} vaults
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500 }}>{formatWeth(tigerQuote.totalWethOut)}</div>
                  <div style={{ fontSize: '12px', color: '#10b981' }}>+{savingsPercent()}%</div>
                </div>
              </div>
            </div>

            {/* Uniswap */}
            <div className="route-option" style={{ opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🦄</span>
                  <div>
                    <span style={{ fontWeight: 500 }}>Uniswap V3</span>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Direct</div>
                  </div>
                </div>
                <div style={{ fontWeight: 500 }}>{formatWeth(uniswapOnlyWeth)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        {tigerQuote && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="info-row">
              <span>Rate</span>
              <span style={{ color: '#fff' }}>1 USDC = {(parseFloat(formatUnits(tigerQuote.totalWethOut, 18)) / parseFloat(usdcAmount)).toFixed(6)} WETH</span>
            </div>
            <div className="info-row">
              <span>Network</span>
              <span>Base Sepolia</span>
            </div>
            <div className="info-row">
              <span>Slippage Tolerance</span>
              <span>{slippage}%</span>
            </div>
          </div>
        )}

        {/* Button */}
        <div style={{ marginTop: '16px' }}>
          {!isConnected ? (
            <button className="btn-primary" disabled>Connect Wallet</button>
          ) : needsApproval() ? (
            <button 
              onClick={handleApprove}
              disabled={isApproving}
              className="btn-primary"
            >
              {isApproving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: '8px' }} /> : null}
              {isApproving ? 'Approving...' : 'Approve USDC'}
            </button>
          ) : (
            <button 
              onClick={handleSwap}
              disabled={!tigerQuote || isSwapping || !usdcAmount || parseFloat(usdcAmount) <= 0}
              className="btn-primary"
            >
              {isSwapping ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: '8px' }} /> : null}
              {isSwapping ? 'Swapping...' : 'Swap'}
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowSettings(false)}
        >
          <div 
            style={{
              background: '#14181f',
              border: '1px solid #2a333c',
              borderRadius: '16px',
              padding: '20px',
              width: '90%',
              maxWidth: '360px',
              animation: 'scaleIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Settings</span>
              <button className="icon-btn" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                Slippage Tolerance
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['0.5', '1.0', '2.0'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: slippage === val ? '#ff6b35' : '#2a333c',
                      background: slippage === val ? 'rgba(255, 107, 53, 0.1)' : '#1a1f28',
                      color: slippage === val ? '#ff6b35' : '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {val}%
                  </button>
                ))}
                <input
                  type="text"
                  inputMode="decimal"
                  value={slippage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setSlippage(val);
                    }
                  }}
                  style={{
                    width: '70px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #2a333c',
                    background: '#1a1f28',
                    color: '#fff',
                    textAlign: 'center',
                    fontWeight: 600,
                    caretColor: '#ff6b35',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                Transaction Deadline
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={deadline}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*$/.test(val)) {
                      setDeadline(val);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #2a333c',
                    background: '#1a1f28',
                    color: '#fff',
                    fontSize: '16px',
                    caretColor: '#ff6b35',
                  }}
                />
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>minutes</span>
              </div>
            </div>

            <button className="btn-primary" onClick={() => setShowSettings(false)}>
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      <TransactionHistory 
        transactions={transactions}
        onClear={clearHistory}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
