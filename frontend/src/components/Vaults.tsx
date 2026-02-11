import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ExternalLink, Loader2 } from 'lucide-react';
import { LIQUIDITY_VAULT_ABI } from '../abis/LiquidityVault';
import { ADDRESSES } from '../abis/addresses';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionHistory } from './TransactionHistory';
import { useTheme } from '../hooks/useTheme';
import { useEthPrice, formatUsdValue } from '../hooks/useEthPrice';

interface VaultData {
  id: string;
  name: string;
  tokenA: { symbol: string; color: string };
  tokenB: { symbol: string; color: string };
  type: 'Volatile' | 'Stable' | 'Hyper';
  fee: string;
  address: string;
}

// Real deployed vaults on Base Sepolia
const VAULTS: VaultData[] = [
  {
    id: 'alpha',
    name: 'Alpha Vault',
    tokenA: { symbol: 'W', color: '#8B5CF6' },
    tokenB: { symbol: 'U', color: '#3B82F6' },
    type: 'Volatile',
    fee: '0.12%',
    address: ADDRESSES.vaults.alpha,
  },
  {
    id: 'beta',
    name: 'Beta Vault',
    tokenA: { symbol: 'W', color: '#8B5CF6' },
    tokenB: { symbol: 'U', color: '#3B82F6' },
    type: 'Stable',
    fee: '0.15%',
    address: ADDRESSES.vaults.beta,
  },
  {
    id: 'gamma',
    name: 'Gamma Vault',
    tokenA: { symbol: 'W', color: '#8B5CF6' },
    tokenB: { symbol: 'U', color: '#3B82F6' },
    type: 'Hyper',
    fee: '0.10%',
    address: ADDRESSES.vaults.gamma,
  },
];

function VaultRow({ vault }: { vault: VaultData }) {
  const { isDark } = useTheme();
  const { ethPrice } = useEthPrice();
  
  // Read vault stats from contract
  const { data: vaultStats, isLoading: statsLoading } = useReadContract({
    address: vault.address as `0x${string}`,
    abi: LIQUIDITY_VAULT_ABI,
    functionName: 'getVaultStats',
  });

  const [wethBal, , , totalFees, , , tradeCount] = vaultStats || [0n, 0n, 0n, 0n, 0n, 0n, 0n];

  // Calculate APY from actual fees
  const apy = tradeCount > 0 && wethBal > 0n 
    ? ((Number(totalFees) * 365 * 100) / Number(wethBal)).toFixed(1)
    : '0.0';

  // Format TVL using real ETH price
  const tvl = wethBal > 0n 
    ? formatUsdValue(formatUnits(wethBal, 18), ethPrice)
    : '$0';

  return (
    <div 
      className="group rounded-2xl md:rounded-none p-4 md:px-4 md:py-6 md:grid md:grid-cols-12 md:gap-4 md:items-center border-b transition-all duration-200"
      style={{
        backgroundColor: isDark ? 'rgba(61, 46, 32, 0.5)' : '#f9fafb',
        borderColor: isDark ? 'transparent' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (isDark) {
          e.currentTarget.style.backgroundColor = '#3d2e20';
        } else {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(61, 46, 32, 0.5)' : '#f9fafb';
      }}
    >
      {/* Vault Name */}
      <div className="col-span-4 flex items-center space-x-4 mb-4 md:mb-0">
        {/* Dual Token Icons */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <div 
            className="w-8 h-8 absolute top-0 left-0 rounded-full flex items-center justify-center text-[10px] text-white font-black z-10 border-2"
            style={{ 
              background: vault.tokenA.color,
              borderColor: isDark ? '#2c2117' : '#ffffff'
            }}
          >
            {vault.tokenA.symbol}
          </div>
          <div 
            className="w-8 h-8 absolute bottom-0 right-0 rounded-full flex items-center justify-center text-[10px] text-white font-black z-20 border-2"
            style={{ 
              background: vault.tokenB.color,
              borderColor: isDark ? '#2c2117' : '#ffffff'
            }}
          >
            {vault.tokenB.symbol}
          </div>
        </div>
        
        <div>
          <h3 
            className="font-display font-bold text-lg"
            style={{ color: isDark ? '#ffffff' : '#111827' }}
          >
            {vault.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ 
                backgroundColor: isDark ? '#3d2e20' : '#e5e7eb',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}
            >
              {vault.type}
            </span>
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ 
                backgroundColor: isDark ? '#3d2e20' : '#e5e7eb',
                color: isDark ? '#9ca3af' : '#6b7280'
              }}
            >
              {vault.fee} Fee
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="grid grid-cols-2 gap-4 md:hidden mb-4">
        <div>
          <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>APY</p>
          <p className="font-display font-bold text-lg text-primary">
            {statsLoading ? <Loader2 size={16} className="animate-spin" /> : `${apy}%`}
          </p>
        </div>
        <div>
          <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>TVL</p>
          <p 
            className="font-display font-bold text-lg"
            style={{ color: isDark ? '#ffffff' : '#111827' }}
          >
            {statsLoading ? <Loader2 size={16} className="animate-spin" /> : tvl}
          </p>
        </div>
        <div>
          <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>My Deposit</p>
          <p 
            className="font-display font-bold text-lg"
            style={{ color: isDark ? '#ffffff' : '#111827' }}
          >
            $0.00
          </p>
        </div>
      </div>

      {/* Desktop Stats */}
      <div className="hidden md:block col-span-2 text-right">
        {statsLoading ? (
          <Loader2 size={16} className="animate-spin ml-auto" />
        ) : (
          <span className="font-display font-bold text-lg text-primary">{apy}%</span>
        )}
      </div>
      <div className="hidden md:block col-span-2 text-right">
        {statsLoading ? (
          <Loader2 size={16} className="animate-spin ml-auto" />
        ) : (
          <span 
            className="font-display font-bold text-base"
            style={{ color: isDark ? '#ffffff' : '#111827' }}
          >
            {tvl}
          </span>
        )}
      </div>
      <div className="hidden md:block col-span-2 text-right">
        <span 
          className="font-display font-bold text-base"
          style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
        >
          $0.00
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex items-center justify-end space-x-2">
        <a
          href={`https://sepolia.basescan.org/address/${vault.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 md:flex-none py-2 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 border"
          style={{
            backgroundColor: isDark ? '#3d2e20' : '#ffffff',
            borderColor: isDark ? '#3d2e20' : '#e5e7eb',
            color: isDark ? '#9ca3af' : '#6b7280'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#2c2117' : '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#3d2e20' : '#ffffff';
          }}
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Manage</span>
        </a>
        <button 
          className="flex-1 md:flex-none py-2 px-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
        >
          Deposit
        </button>
      </div>
    </div>
  );
}

function VaultStats() {
  const { isDark } = useTheme();
  const { ethPrice } = useEthPrice();
  
  // Read all vault stats
  const { data: alphaStats } = useReadContract({
    address: VAULTS[0].address as `0x${string}`,
    abi: LIQUIDITY_VAULT_ABI,
    functionName: 'getVaultStats',
  });
  const { data: betaStats } = useReadContract({
    address: VAULTS[1].address as `0x${string}`,
    abi: LIQUIDITY_VAULT_ABI,
    functionName: 'getVaultStats',
  });
  const { data: gammaStats } = useReadContract({
    address: VAULTS[2].address as `0x${string}`,
    abi: LIQUIDITY_VAULT_ABI,
    functionName: 'getVaultStats',
  });

  // Calculate total TVL
  const totalWeth = (alphaStats?.[0] || 0n) + (betaStats?.[0] || 0n) + (gammaStats?.[0] || 0n);
  const totalFees = (alphaStats?.[3] || 0n) + (betaStats?.[3] || 0n) + (gammaStats?.[3] || 0n);
  
  const totalTvl = totalWeth > 0n 
    ? formatUsdValue(formatUnits(totalWeth, 18), ethPrice)
    : '$0';
    
  const dailyFees = totalFees > 0n
    ? `$${(Number(formatUnits(totalFees, 6)) / 100).toFixed(2)}` // Approximate daily
    : '$0.00';

  const cardStyle = {
    backgroundColor: isDark ? 'rgba(44, 33, 23, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    borderColor: isDark ? 'rgba(61, 46, 32, 0.3)' : 'rgba(255, 255, 255, 0.2)',
    borderWidth: '1px',
    borderStyle: 'solid'
  };

  const labelStyle = {
    color: '#6b7280',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    letterSpacing: '0.1em',
    marginBottom: '4px'
  };

  return (
    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div className="rounded-2xl p-4 backdrop-blur-sm" style={cardStyle}>
        <p style={labelStyle}>Total TVL</p>
        <p 
          className="text-xl font-display font-bold"
          style={{ color: isDark ? '#ffffff' : '#111827' }}
        >
          {totalTvl}
        </p>
      </div>
      <div className="rounded-2xl p-4 backdrop-blur-sm" style={cardStyle}>
        <p style={labelStyle}>24h Fees</p>
        <p className="text-xl font-display font-bold text-green-500">{dailyFees}</p>
      </div>
      <div className="rounded-2xl p-4 backdrop-blur-sm" style={cardStyle}>
        <p style={labelStyle}>ETH Price</p>
        <p className="text-xl font-display font-bold text-primary">${ethPrice.toLocaleString()}</p>
      </div>
      <div className="rounded-2xl p-4 backdrop-blur-sm" style={cardStyle}>
        <p style={labelStyle}>Active Vaults</p>
        <p 
          className="text-xl font-display font-bold"
          style={{ color: isDark ? '#ffffff' : '#111827' }}
        >
          3
        </p>
      </div>
    </div>
  );
}

export function Vaults() {
  const { address } = useAccount();
  const { isDark } = useTheme();
  const { transactions, clearHistory } = useTransactions(address);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8 relative z-10">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full orb" />
        <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full orb" />
      </div>
      
      <div className="text-center mb-10 mt-6">
        <h1 
          className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight"
          style={{ color: isDark ? '#ffffff' : '#111827' }}
        >
          Liquidity Vaults
        </h1>
        <p 
          className="text-lg font-medium"
          style={{ color: isDark ? '#9ca3af' : '#4b5563' }}
        >
          Earn high-yield on your assets.
        </p>
      </div>
      
      <div className="w-full max-w-5xl relative">
        <div 
          className="relative rounded-3xl shadow-2xl overflow-hidden glass-panel"
          style={{
            backgroundColor: isDark ? '#2c2117' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(61, 46, 32, 0.5)' : '#e5e7eb'}`
          }}
        >
          <div className="p-6 sm:p-8">
            {/* Desktop Header */}
            <div 
              className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b px-4 text-xs font-bold uppercase tracking-widest"
              style={{
                borderColor: isDark ? 'rgba(61, 46, 32, 0.5)' : '#f3f4f6',
                color: '#6b7280'
              }}
            >
              <div className="col-span-4">Vault Name</div>
              <div className="col-span-2 text-right">APY</div>
              <div className="col-span-2 text-right">TVL</div>
              <div className="col-span-2 text-right">My Deposit</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* Vault Rows */}
            <div className="space-y-4 md:space-y-0 mt-4 md:mt-0">
              {VAULTS.map((vault) => (
                <VaultRow key={vault.id} vault={vault} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <VaultStats />
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
