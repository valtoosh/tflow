import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { X, CheckCircle, Loader2 } from 'lucide-react';

interface TransactionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'pending' | 'success' | 'failed' | null;
  hash?: string;
  fromToken: { symbol: string; amount: string };
  toToken: { symbol: string; amount: string };
  currentStep?: number;
}

const steps = [
  { id: 1, title: 'Initializing Wallet', description: 'Signature verified successfully.' },
  { id: 2, title: 'Smart Routing', description: 'Finding the best price across pools.' },
  { id: 3, title: 'On-Chain Confirmation', description: 'Waiting for block validation.' },
  { id: 4, title: 'Completed', description: 'Transaction finalized.' },
];

// Liquidity nodes configuration
const liquidityNodes = [
  { id: 'alpha', name: 'Alpha Vault', icon: 'A', position: 'top-[15%] left-[20%]', delay: 0, beamAngle: '28deg' },
  { id: 'beta', name: 'Beta Vault', icon: 'B', position: 'bottom-[20%] left-[25%]', delay: 0.5, beamAngle: '-40deg' },
  { id: 'gamma', name: 'Gamma Vault', icon: 'Γ', position: 'top-[20%] right-[20%]', delay: 1, beamAngle: '-165deg' },
];

export function TransactionFlow({ 
  isOpen, 
  onClose, 
  status: _status, 
  hash,
  fromToken,
  toToken,
  currentStep = 2 
}: TransactionFlowProps) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex"
      >
        {/* Left/Center - Visualization Area */}
        <div className={`flex-1 relative flex items-center justify-center p-8 ${
          isDark 
            ? 'bg-[#221910]'
            : 'bg-[#f8f7f5]'
        }`}
        style={{
          backgroundImage: isDark 
            ? `radial-gradient(circle at 50% 50%, rgba(242, 127, 13, 0.08) 0%, transparent 60%),
               linear-gradient(rgba(34, 25, 16, 0.9), rgba(34, 25, 16, 0.9)),
               url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f27f0d' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            : `radial-gradient(circle at 50% 50%, rgba(242, 84, 27, 0.05) 0%, transparent 60%),
               linear-gradient(rgba(248, 247, 245, 0.9), rgba(248, 247, 245, 0.9))`
        }}
        >
          {/* Status Toast */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg ${
              isDark 
                ? 'bg-[#2c2117] border border-[#f27f0d]/20' 
                : 'bg-white border border-primary/20'
            }`}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-medium tracking-wide text-primary uppercase">
                Smart Routing Active
              </span>
            </div>
          </div>

          {/* Visualization Canvas */}
          <div className="relative w-full max-w-4xl aspect-video mx-auto">
            {/* Central Hub - Tiger Claw */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
                <div className={`relative z-10 p-6 rounded-full border shadow-lg ${
                  isDark 
                    ? 'bg-[#2c2117] border-primary/30' 
                    : 'bg-white border-primary/30'
                }`}
                style={{ boxShadow: '0 0 15px rgba(242, 84, 27, 0.3)' }}
                >
                  {/* Tiger Logo */}
                  <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.8,2.1c-0.6-0.3-1.3,0.1-1.4,0.7c-0.6,2.6-2.5,4.7-5.1,5.5c-0.6,0.2-0.9,0.9-0.5,1.4 c1.2,1.5,1.9,3.4,1.9,5.5c0,4.8-3.9,8.7-8.7,8.7c-0.1,0-0.2,0-0.4,0c2.2,0,4.3-0.9,5.8-2.4c1.5-1.5,2.4-3.6,2.4-5.8 c0-1.6-0.5-3.1-1.3-4.4c2.1-0.2,4-1.2,5.4-2.8c0.8,3.3,3.7,5.8,7.2,6.1c-2.6-2.8-4.2-6.5-4.2-10.6C13.9,3.4,13.4,2.4,12.8,2.1z"/>
                    <path d="M21.7,13c-1.3-1.6-3.2-2.7-5.4-2.8c0.7,1.2,1.2,2.6,1.2,4.1c0,2.2-0.9,4.2-2.3,5.7c1.5,1.5,3.6,2.4,5.8,2.4 c-0.1,0-0.3,0-0.4,0C22.6,19.3,23.3,16.2,21.7,13z"/>
                  </svg>
                </div>
                {/* Ripple Effects */}
                <div className="absolute inset-0 border border-primary/40 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-[-10px] border border-primary/20 rounded-full animate-pulse opacity-30 delay-75"></div>
              </div>
            </div>

            {/* Liquidity Nodes */}
            {liquidityNodes.map((node) => (
              <div key={node.id} className={`absolute ${node.position} group`}>
                <div className="relative flex flex-col items-center gap-2">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg border transition-colors duration-500 ${
                    isDark 
                      ? 'bg-[#2c2117] border-white/10 group-hover:border-primary/50' 
                      : 'bg-white border-gray-200 group-hover:border-primary/50'
                  }`}>
                    <span className={`text-lg font-bold ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      {node.icon}
                    </span>
                  </div>
                  <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {node.name}
                  </span>
                  {/* Beam to Center */}
                  <div 
                    className="absolute top-1/2 left-1/2 w-[300px] h-[2px] origin-left opacity-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #f2541b, transparent)',
                      transform: `translateX(1rem) translateY(1rem) rotate(${node.beamAngle})`,
                      animation: `beam 2s infinite ${node.delay}s`,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-10" stroke={isDark ? 'white' : 'black'} strokeWidth="1">
              <line strokeDasharray="4 4" x1="22%" x2="50%" y1="18%" y2="50%" />
              <line strokeDasharray="4 4" x1="27%" x2="50%" y1="80%" y2="50%" />
              <line strokeDasharray="4 4" x1="78%" x2="50%" y1="23%" y2="50%" />
            </svg>
          </div>

          {/* Bottom Caption */}
          <div className="absolute bottom-12 w-full text-center">
            <p className={`text-sm animate-pulse tracking-widest uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Optimizing route across 3 liquidity pools...
            </p>
          </div>
        </div>

        {/* Right Sidebar - Transaction Details */}
        <aside className={`w-96 h-full flex flex-col shadow-2xl ${
          isDark 
            ? 'bg-[#2c2117]/60 border-l border-[#f27f0d]/10 backdrop-blur-xl' 
            : 'bg-white/80 border-l border-primary/10 backdrop-blur-xl'
        }`}>
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Transaction Details</h2>
                {hash && (
                  <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-mono">
                    #{hash.slice(0, 6)}...{hash.slice(-4)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Swap in Progress</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your assets are being routed.</p>
            </div>
            <button 
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>

          {/* Stepper */}
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="relative pl-4 border-l border-white/10 space-y-12">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep - 1;
                const isActive = index === currentStep - 1;
                const isPending = index > currentStep - 1;

                return (
                  <div key={step.id} className={`relative ${isPending ? 'opacity-30' : ''}`}>
                    {/* Node */}
                    <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-4 ${
                      isCompleted 
                        ? 'bg-primary border-background-dark shadow-[0_0_10px_rgba(242,84,27,0.5)]'
                        : isActive
                          ? 'bg-primary border-background-dark animate-pulse shadow-[0_0_15px_rgba(242,84,27,0.8)]'
                          : 'bg-white/20 border-background-dark'
                    }`} />

                    {/* Connecting Line */}
                    {index > 0 && (
                      <div className={`absolute -left-[1px] -top-12 h-12 w-[2px] ${
                        isCompleted || isActive ? 'bg-primary' : 'bg-white/10'
                      }`} />
                    )}

                    {/* Content */}
                    <div className={isActive ? `${isDark ? 'bg-[#3d2e20]/50' : 'bg-primary/5'} p-4 rounded-lg border border-primary/20` : ''}>
                      <h3 className={`text-sm font-bold mb-1 flex items-center gap-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {step.title}
                        {isCompleted && <CheckCircle size={16} className="text-primary" />}
                        {isActive && <Loader2 size={16} className="text-primary animate-spin" />}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                      
                      {isActive && (
                        <div className={`flex justify-between items-center text-xs font-mono mt-3 p-2 rounded ${
                          isDark ? 'bg-black/30' : 'bg-gray-100'
                        }`}>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{fromToken.symbol}</span>
                          <span className="text-primary">&gt;&gt;&gt;</span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{toToken.symbol}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Stats */}
          <div className={`p-6 border-t ${isDark ? 'bg-[#3d2e20] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`col-span-2 p-3 rounded-lg border flex justify-between items-center ${
                isDark 
                  ? 'bg-black/40 border-white/5' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex flex-col">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sending</span>
                  <span className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {fromToken.amount} {fromToken.symbol}
                  </span>
                </div>
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>&rarr;</span>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Receiving</span>
                  <span className="text-lg font-bold text-primary font-mono">
                    ~{toToken.amount} {toToken.symbol}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Rate</span>
                <span className={`text-xs font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>1 {fromToken.symbol} = 840 {toToken.symbol}</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Slippage</span>
                <span className={`text-xs font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>Auto (0.5%)</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Network Cost</span>
                <span className={`text-xs font-mono flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span className="text-primary text-[10px]">⛽</span> $4.50
                </span>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Est. Time</span>
                <span className={`text-xs font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>~15 sec</span>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className={`w-full py-3 rounded-lg border text-sm font-medium uppercase tracking-wider transition-colors ${
                isDark 
                  ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50' 
                  : 'border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50'
              }`}
            >
              Cancel Transaction
            </button>
          </div>
        </aside>

        {/* Beam Animation Keyframes */}
        <style>{`
          @keyframes beam {
            0% { opacity: 0; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0; transform: scale(0.95); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
