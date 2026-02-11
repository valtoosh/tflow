import { useState, useRef, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TrendingUp, Wallet, ExternalLink, ArrowDown, ArrowUp, Loader2, History } from 'lucide-react';
import { LIQUIDITY_VAULT_ABI } from '../abis/LiquidityVault';
import { ERC20_ABI } from '../abis/ERC20';
import { ADDRESSES } from '../abis/addresses';
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

interface VaultData {
  name: string;
  address: string;
  fee: string;
  feeBps: number;
}

const VAULTS: VaultData[] = [
  { name: 'Alpha Vault', address: ADDRESSES.vaults.alpha, fee: '0.12%', feeBps: 12 },
  { name: 'Beta Vault', address: ADDRESSES.vaults.beta, fee: '0.15%', feeBps: 15 },
  { name: 'Gamma Vault', address: ADDRESSES.vaults.gamma, fee: '0.10%', feeBps: 10 },
];

function VaultCard({ vault, onAddTx, onUpdateTx }: { vault: VaultData, onAddTx: any, onUpdateTx: any }) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  useSpotlight(cardRef);

  // Read vault stats
  const { data: vaultStats, refetch: refetchStats } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: LIQUIDITY_VAULT_ABI,
    functionName: 'getVaultStats',
  });

  const { data: wethBalance } = useReadContract({
    address: ADDRESSES.tokens.weth,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: wethAllowance, refetch: refetchAllowance } = useReadContract({
    address: ADDRESSES.tokens.weth,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, vault.address as `0x${string}`] : undefined,
  });

  // Write contracts
  const { writeContract: approveWeth, data: approveHash } = useWriteContract();
  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { writeContract: withdrawWeth, data: withdrawHash } = useWriteContract();

  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  useEffect(() => {
    if (approveSuccess) {
      setIsApproving(false);
      refetchAllowance();
      if (approveHash) onUpdateTx(approveHash, { status: 'success' });
    }
  }, [approveSuccess, refetchAllowance, approveHash, onUpdateTx]);

  useEffect(() => {
    if (depositSuccess) {
      setAmount('');
      setAction(null);
      refetchStats();
      if (depositHash) onUpdateTx(depositHash, { status: 'success' });
    }
  }, [depositSuccess, refetchStats, depositHash, onUpdateTx]);

  useEffect(() => {
    if (withdrawSuccess) {
      setAmount('');
      setAction(null);
      refetchStats();
      if (withdrawHash) onUpdateTx(withdrawHash, { status: 'success' });
    }
  }, [withdrawSuccess, refetchStats, withdrawHash, onUpdateTx]);

  const [wethBal, usdcBal,,, totalVolume,, tradeCount] = vaultStats || [0n, 0n, 0n, 0n, 0n, 0n, 0n];

  const needsApproval = () => {
    if (!amount || !wethAllowance || action !== 'deposit') return false;
    return wethAllowance < parseUnits(amount, 18);
  };

  const handleApprove = () => {
    if (!amount) return;
    setIsApproving(true);
    
    onAddTx({
      hash: '',
      type: 'approve',
      description: `Approve WETH for ${vault.name}`,
      from: address!,
    });

    approveWeth({
      address: ADDRESSES.tokens.weth,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vault.address as `0x${string}`, parseUnits(amount, 18)],
    }, {
      onSuccess: (hash) => onUpdateTx('', { hash }),
    });
  };

  const handleDeposit = () => {
    if (!amount) return;
    
    onAddTx({
      hash: '',
      type: 'deposit',
      description: `Deposit ${amount} WETH to ${vault.name}`,
      from: address!,
      amount,
    });

    deposit({
      address: vault.address as `0x${string}`,
      abi: LIQUIDITY_VAULT_ABI,
      functionName: 'deposit',
      args: [parseUnits(amount, 18)],
    }, {
      onSuccess: (hash) => onUpdateTx('', { hash }),
    });
  };

  const handleWithdraw = () => {
    if (!amount) return;
    
    onAddTx({
      hash: '',
      type: 'withdraw',
      description: `Withdraw ${amount} WETH from ${vault.name}`,
      from: address!,
      amount,
    });

    withdrawWeth({
      address: vault.address as `0x${string}`,
      abi: LIQUIDITY_VAULT_ABI,
      functionName: 'withdrawWeth',
      args: [parseUnits(amount, 18)],
    }, {
      onSuccess: (hash) => onUpdateTx('', { hash }),
    });
  };

  const formatAmount = (amount: bigint, decimals: number) => {
    if (!amount) return '0.0000';
    return parseFloat(formatUnits(amount, decimals)).toFixed(4);
  };

  return (
    <div ref={cardRef} className="feature-card" style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'rgba(255, 107, 53, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Wallet size={24} style={{ color: '#ff6b35' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '2px' }}>{vault.name}</h3>
            <a 
              href={`https://sepolia.basescan.org/address/${vault.address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Fee</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#10b981' }}>{vault.fee}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        background: '#11141a',
        borderRadius: '10px',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>WETH Liquidity</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '2px' }}>{formatAmount(wethBal, 18)} WETH</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>USDC Earned</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '2px', color: '#10b981' }}>{formatAmount(usdcBal, 6)} USDC</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Volume</div>
          <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>{formatAmount(totalVolume, 6)} USDC</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trades</div>
          <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>{tradeCount.toString()}</div>
        </div>
      </div>

      {/* Action Buttons */}
      {!action ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-primary"
            style={{ flex: 1, background: '#1a1f28', border: '1px solid #2a333c' }}
            onClick={() => setAction('deposit')}
          >
            <ArrowDown size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Deposit
          </button>
          <button 
            className="btn-primary"
            style={{ flex: 1, background: '#1a1f28', border: '1px solid #2a333c' }}
            onClick={() => setAction('withdraw')}
          >
            <ArrowUp size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Withdraw
          </button>
        </div>
      ) : (
        <div style={{ animation: 'slideUp 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                }
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #2a333c',
                background: '#11141a',
                color: '#fff',
                fontSize: '18px',
                caretColor: '#ff6b35',
              }}
              autoFocus
            />
            <span style={{ color: '#6b7280', fontSize: '14px' }}>WETH</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-primary"
              style={{ flex: 1, background: '#2a333c' }}
              onClick={() => { setAction(null); setAmount(''); }}
            >
              Cancel
            </button>
            
            {action === 'deposit' && needsApproval() ? (
              <button 
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleApprove}
                disabled={isApproving || !amount}
              >
                {isApproving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Approve'}
              </button>
            ) : (
              <button 
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={action === 'deposit' ? handleDeposit : handleWithdraw}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {action === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
            )}
          </div>

          {action === 'deposit' && wethBalance ? (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>
              Balance: {formatAmount(wethBalance, 18)} WETH
              <button 
                onClick={() => wethBalance && setAmount(formatUnits(wethBalance, 18))}
                style={{ marginLeft: '8px', color: '#ff6b35', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
              >
                MAX
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Transaction Links */}
      {(approveHash || depositHash || withdrawHash) && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #2a333c' }}>
          {approveHash && (
            <a 
              href={`https://sepolia.basescan.org/tx/${approveHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', color: '#ff6b35', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View approval <ExternalLink size={12} />
            </a>
          )}
          {depositHash && (
            <a 
              href={`https://sepolia.basescan.org/tx/${depositHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View deposit <ExternalLink size={12} />
            </a>
          )}
          {withdrawHash && (
            <a 
              href={`https://sepolia.basescan.org/tx/${withdrawHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View withdrawal <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function Vaults() {
  const { address } = useAccount();
  const { transactions, addTransaction, updateTransaction, clearHistory } = useTransactions(address);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <main>
      <div className="container">
        <div className="hero">
          <h1>Liquidity Vaults</h1>
          <p>Deposit WETH to earn swap fees from TigerFlow traders</p>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-value">0.01 WETH</div>
            <div className="stat-label">Total Liquidity</div>
          </div>
          <div className="stat">
            <div className="stat-value">0.12%</div>
            <div className="stat-label">Avg Fee</div>
          </div>
          <div className="stat" style={{ cursor: 'pointer' }} onClick={() => setShowHistory(true)}>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={14} />
              {transactions.length}
            </div>
            <div className="stat-label">Transactions</div>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
            {VAULTS.map((vault) => (
              <VaultCard 
                key={vault.address} 
                vault={vault} 
                onAddTx={addTransaction}
                onUpdateTx={updateTransaction}
              />
            ))}
          </div>

          <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: '#ff6b35' }} />
              How it works
            </h3>
            <ol style={{ fontSize: '14px', color: '#9ca3af', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Deposit WETH into any vault to become a liquidity provider</li>
              <li>When traders swap USDC→WETH, your vault may be used for optimal routing</li>
              <li>Earn fees in USDC from every swap that uses your liquidity</li>
              <li>Withdraw your WETH and earned USDC anytime - no lock-up period</li>
            </ol>
          </div>
        </div>
      </div>

      <TransactionHistory 
        transactions={transactions}
        onClear={clearHistory}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </main>
  );
}
