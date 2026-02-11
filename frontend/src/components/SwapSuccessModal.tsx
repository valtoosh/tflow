import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { Check, ExternalLink } from 'lucide-react';

interface SwapSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromAmount: string;
  fromToken: string;
  toAmount: string;
  toToken: string;
  txHash: string;
  route?: Array<{ type: string; percentage: number }>;
}

export function SwapSuccessModal({
  isOpen,
  onClose,
  fromToken,
  toAmount,
  toToken,
  txHash,
  route = [],
}: SwapSuccessModalProps) {
  const { isDark } = useTheme();

  const getExplorerUrl = (hash: string) => {
    return `https://sepolia.basescan.org/tx/${hash}`;
  };

  // Format route for display
  const routeNames = route.length > 0 
    ? route.map(r => r.type === 'robinpump' ? 'RobinPump' : r.type === 'vault' ? 'Vault' : 'Uniswap V3').join(' + ')
    : 'Uniswap V3';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="w-full max-w-[420px] relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div 
                className="absolute -inset-1 rounded-3xl blur-xl opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(242, 84, 27, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%)'
                }}
              />
              
              {/* Card */}
              <div 
                className="relative rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? '#1C242D' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                }}
              >
                {/* Success Icon */}
                <div className="flex flex-col items-center pt-10 pb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    {/* Outer ring */}
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(242, 84, 27, 0.2) 0%, rgba(242, 84, 27, 0.05) 100%)',
                      }}
                    >
                      {/* Middle ring */}
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(242, 84, 27, 0.3) 0%, rgba(242, 84, 27, 0.1) 100%)',
                        }}
                      >
                        {/* Inner circle */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #F2541B 0%, #D9420D 100%)',
                            boxShadow: '0 4px 20px rgba(242, 84, 27, 0.4)',
                          }}
                        >
                          <Check className="w-8 h-8 text-white" strokeWidth={3} />
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Pulse animation */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'rgba(242, 84, 27, 0.3)',
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                  
                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold mt-6 mb-2"
                    style={{ color: isDark ? '#ffffff' : '#111827' }}
                  >
                    Swap Successful
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-center px-8"
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  >
                    Your transaction has been processed successfully on the Base network.
                  </motion.p>
                </div>
                
                {/* Amount Received */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mx-6 p-5 rounded-2xl text-center"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                >
                  <p 
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  >
                    You Received
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
                    >
                      {toToken[0]}
                    </div>
                    <span 
                      className="text-3xl font-bold"
                      style={{ color: isDark ? '#ffffff' : '#111827' }}
                    >
                      {parseFloat(toAmount).toFixed(4)} {toToken}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span 
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: '#22C55E'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                      Exact Amount
                    </span>
                  </div>
                </motion.div>
                
                {/* Route Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mx-6 mt-5"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span 
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                    >
                      Route
                    </span>
                    <span 
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#F2541B' }}
                    >
                      Completed
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div 
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #F2541B 0%, #F97316 100%)',
                      }}
                    />
                  </div>
                  
                  {/* Route labels */}
                  <div className="flex justify-between mt-2 text-xs">
                    <span style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{fromToken}</span>
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: '#F2541B' }}
                      />
                      <span style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        {routeNames}
                      </span>
                    </div>
                    <span style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>{toToken}</span>
                  </div>
                </motion.div>
                
                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="p-6 grid grid-cols-2 gap-3"
                >
                  <a
                    href={getExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border"
                    style={{
                      backgroundColor: isDark ? 'transparent' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                      color: isDark ? '#9CA3AF' : '#6B7280',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? 'transparent' : '#ffffff';
                    }}
                  >
                    <ExternalLink size={16} style={{ color: '#F2541B' }} />
                    BaseScan
                  </a>
                  
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #F2541B 0%, #D9420D 100%)',
                      boxShadow: '0 4px 15px rgba(242, 84, 27, 0.4)',
                    }}
                  >
                    Done
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
