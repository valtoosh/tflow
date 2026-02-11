import { useState } from 'react';
import { ExternalLink, X, Clock, CheckCircle, XCircle, History } from 'lucide-react';
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
      return <Clock size={16} style={{ color: '#f59e0b', animation: 'spin 2s linear infinite' }} />;
    case 'success':
      return <CheckCircle size={16} style={{ color: '#10b981' }} />;
    case 'failed':
      return <XCircle size={16} style={{ color: '#ef4444' }} />;
  }
};

const getTypeLabel = (type: Transaction['type']) => {
  switch (type) {
    case 'swap':
      return 'Swap';
    case 'approve':
      return 'Approve';
    case 'deposit':
      return 'Deposit';
    case 'withdraw':
      return 'Withdraw';
  }
};

const getTypeColor = (type: Transaction['type']) => {
  switch (type) {
    case 'swap':
      return '#ff6b35';
    case 'approve':
      return '#3b82f6';
    case 'deposit':
      return '#10b981';
    case 'withdraw':
      return '#8b5cf6';
  }
};

export function TransactionHistory({ transactions, onClear, isOpen, onClose }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<Transaction['type'] | 'all'>('all');

  if (!isOpen) return null;

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  return (
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
      onClick={onClose}
    >
      <div 
        style={{
          background: '#14181f',
          border: '1px solid #2a333c',
          borderRadius: '16px',
          padding: '20px',
          width: '90%',
          maxWidth: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} style={{ color: '#ff6b35' }} />
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Transaction History</span>
            <span style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              background: '#1a1f28',
              padding: '2px 8px',
              borderRadius: '100px',
            }}>
              {transactions.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {transactions.length > 0 && (
              <button 
                onClick={onClear}
                style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Clear
              </button>
            )}
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
          {(['all', 'swap', 'approve', 'deposit', 'withdraw'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: '100px',
                border: '1px solid',
                borderColor: filter === f ? '#ff6b35' : '#2a333c',
                background: filter === f ? 'rgba(255, 107, 53, 0.1)' : '#1a1f28',
                color: filter === f ? '#ff6b35' : '#9ca3af',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
              <History size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.hash}
                  style={{
                    background: '#1a1f28',
                    borderRadius: '10px',
                    padding: '12px',
                    border: '1px solid #2a333c',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusIcon(tx.status)}
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600,
                        color: getTypeColor(tx.type),
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {getTypeLabel(tx.type)}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      {formatTime(tx.timestamp)}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#fff', marginBottom: '8px' }}>
                    {tx.description}
                  </p>

                  <a 
                    href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '12px', 
                      color: '#6b7280', 
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
