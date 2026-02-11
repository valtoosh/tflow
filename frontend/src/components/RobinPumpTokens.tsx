import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TrendingUp, Flame, Clock, ExternalLink } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { ROBIN_PUMP_ADAPTER_ABI } from '../abis/RobinPumpAdapter';

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

interface RobinPumpTokensProps {
  onSelectToken: (token: RobinPumpToken) => void;
  selectedToken?: RobinPumpToken;
}

// Mock data for hackathon demo - in production, fetch from RobinPump subgraph
const MOCK_TOKENS: RobinPumpToken[] = [
  {
    address: '0x1234...5678',
    symbol: 'TIGER',
    name: 'Tiger Token',
    price: 0.00042,
    marketCap: 42000,
    volume24h: 12500,
    holders: 156,
    timeSinceLaunch: '2h ago',
    isHot: true,
  },
  {
    address: '0xabcd...ef01',
    symbol: 'BASE',
    name: 'Base Moon',
    price: 0.00018,
    marketCap: 18000,
    volume24h: 8900,
    holders: 89,
    timeSinceLaunch: '5h ago',
    isHot: true,
  },
  {
    address: '0x9876...5432',
    symbol: 'PUMP',
    name: 'Pump It',
    price: 0.000065,
    marketCap: 6500,
    volume24h: 3200,
    holders: 45,
    timeSinceLaunch: '12h ago',
    isHot: false,
  },
  {
    address: '0xfedc...ba98',
    symbol: 'MEME',
    name: 'Meme Coin',
    price: 0.000023,
    marketCap: 2300,
    volume24h: 1200,
    holders: 23,
    timeSinceLaunch: '1d ago',
    isHot: false,
  },
];

export function RobinPumpTokens({ onSelectToken, selectedToken }: RobinPumpTokensProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'hot' | 'new'>('all');

  // In production, this would fetch from the adapter contract
  // const { data: activePools } = useReadContract({
  //   address: ROBIN_PUMP_ADAPTER_ADDRESS.baseSepolia,
  //   abi: ROBIN_PUMP_ADAPTER_ABI,
  //   functionName: 'getActivePools',
  // });

  const filteredTokens = MOCK_TOKENS.filter((token) => {
    const matchesSearch = 
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'hot') return matchesSearch && token.isHot;
    if (activeFilter === 'new') return matchesSearch && token.timeSinceLaunch.includes('h');
    return matchesSearch;
  });

  return (
    <div 
      className="rounded-2xl p-6 border"
      style={{
        backgroundColor: isDark ? '#2c2117' : '#ffffff',
        borderColor: isDark ? '#3d2e20' : '#e5e7eb'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F2541B 0%, #ff6b35 100%)' }}
          >
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h3 
              className="font-display font-bold text-lg"
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              RobinPump Tokens
            </h3>
            <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>
              Discover early-stage tokens on bonding curves
            </p>
          </div>
        </div>
        <a
          href="https://robinpump.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#F2541B' }}
        >
          Launch Token <ExternalLink size={12} />
        </a>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
          style={{
            backgroundColor: isDark ? '#3d2e20' : '#f3f4f6',
            color: isDark ? '#ffffff' : '#111827',
            border: `1px solid ${isDark ? '#3d2e20' : '#e5e7eb'}`
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'hot', 'new'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: activeFilter === filter 
                ? '#F2541B' 
                : isDark ? '#3d2e20' : '#f3f4f6',
              color: activeFilter === filter 
                ? '#ffffff' 
                : isDark ? '#9ca3af' : '#6b7280'
            }}
          >
            {filter === 'hot' && <Flame size={12} className="inline mr-1" />}
            {filter}
          </button>
        ))}
      </div>

      {/* Token List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredTokens.map((token) => (
          <button
            key={token.address}
            onClick={() => onSelectToken(token)}
            className="w-full p-4 rounded-xl border-2 transition-all text-left"
            style={{
              backgroundColor: selectedToken?.address === token.address
                ? isDark ? 'rgba(242, 84, 27, 0.1)' : 'rgba(242, 84, 27, 0.05)'
                : isDark ? '#3d2e20' : '#f9fafb',
              borderColor: selectedToken?.address === token.address
                ? '#F2541B'
                : isDark ? '#3d2e20' : '#e5e7eb'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Token Icon */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {token.symbol[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-bold"
                      style={{ color: isDark ? '#ffffff' : '#111827' }}
                    >
                      {token.symbol}
                    </span>
                    {token.isHot && (
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: '#F2541B', color: '#ffffff' }}
                      >
                        HOT
                      </span>
                    )}
                  </div>
                  <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>
                    {token.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p 
                  className="font-bold"
                  style={{ color: isDark ? '#ffffff' : '#111827' }}
                >
                  ${token.price.toFixed(6)}
                </p>
                <div className="flex items-center gap-2" style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '11px' }}>
                  <Clock size={10} />
                  {token.timeSinceLaunch}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? '#2c2117' : '#e5e7eb'}` }}>
              <div>
                <p style={{ color: isDark ? '#6b7280' : '#9ca3af', fontSize: '10px' }}>Market Cap</p>
                <p style={{ color: isDark ? '#ffffff' : '#111827', fontSize: '12px', fontWeight: 600 }}>
                  ${(token.marketCap / 1000).toFixed(1)}k
                </p>
              </div>
              <div>
                <p style={{ color: isDark ? '#6b7280' : '#9ca3af', fontSize: '10px' }}>Volume 24h</p>
                <p style={{ color: isDark ? '#ffffff' : '#111827', fontSize: '12px', fontWeight: 600 }}>
                  ${(token.volume24h / 1000).toFixed(1)}k
                </p>
              </div>
              <div>
                <p style={{ color: isDark ? '#6b7280' : '#9ca3af', fontSize: '10px' }}>Holders</p>
                <p style={{ color: isDark ? '#ffffff' : '#111827', fontSize: '12px', fontWeight: 600 }}>
                  {token.holders}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bonding Curve Info */}
      <div 
        className="mt-4 p-4 rounded-xl"
        style={{ backgroundColor: isDark ? 'rgba(242, 84, 27, 0.1)' : 'rgba(242, 84, 27, 0.05)' }}
      >
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '11px' }}>
          <strong style={{ color: '#F2541B' }}>How it works:</strong> Tokens are traded on a bonding curve. 
          Price increases as more tokens are bought. When the market cap reaches $100k, 
          the token graduates to Uniswap V3.
        </p>
      </div>
    </div>
  );
}
