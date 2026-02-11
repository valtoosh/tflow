import { useState } from 'react';
import { ExternalLink, X, Clock, CheckCircle, XCircle, History } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { Transaction } from '../hooks/useTransactions';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusIcon = (status: Transaction['status']) => {
  switch (status) {
    case 'pending':
      return <Clock size={16} className="text-amber-500 animate-spin" />;
    case 'success':
      return <CheckCircle size={16} className="text-green-500" />;
    case 'failed':
      return <XCircle size={16} className="text-red-500" />;
  }
};

const getTypeLabel = (type: Transaction['type']) => {
  switch (type) {
    case 'swap': return 'Swap';
    case 'approve': return 'Approve';
    case 'deposit': return 'Deposit';
    case 'withdraw': return 'Withdraw';
  }
};

const getTypeColor = (type: Transaction['type']) => {
  switch (type) {
    case 'swap': return 'text-primary';
    case 'approve': return 'text-blue-500';
    case 'deposit': return 'text-green-500';
    case 'withdraw': return 'text-purple-500';
  }
};

export function TransactionHistory({ transactions, onClear, isOpen, onClose }: TransactionHistoryProps) {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<Transaction['type'] | 'all'>('all');

  if (!isOpen) return null;

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md rounded-3xl p-7 shadow-2xl flex flex-col max-h-[80vh] ${
          isDark 
            ? 'bg-[#2c2117] border border-[#3d2e20]' 
            : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History size={22} className="text-primary" />
            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isDark ? 'History' : 'Transaction History'}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isDark ? 'bg-[#3d2e20] text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              {transactions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <button 
                onClick={onClear}
                className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-2"
              >
                Clear
              </button>
            )}
            <button 
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-[#3d2e20] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
          {(['all', 'swap', 'approve', 'deposit', 'withdraw'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all border-2 ${
                filter === f 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : isDark 
                    ? 'border-[#3d2e20] text-gray-400 hover:border-gray-600' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="overflow-y-auto flex-1">
          {filteredTransactions.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <History size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.hash}
                  className={`rounded-2xl p-4 border ${
                    isDark 
                      ? 'bg-[#3d2e20] border-[#3d2e20]' 
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(tx.status)}
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${getTypeColor(tx.type)}`}>
                        {getTypeLabel(tx.type)}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatTime(tx.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {tx.description}
                    </span>
                    <a 
                      href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-hover"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
