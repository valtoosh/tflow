import { useState, useEffect, useCallback } from 'react';

export interface Transaction {
  hash: string;
  type: 'swap' | 'approve' | 'deposit' | 'withdraw';
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  description: string;
  from: string;
  to?: string;
  amount?: string;
}

const STORAGE_KEY = 'tigerflow_transactions';

export function useTransactions(address: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }
    const stored = localStorage.getItem(`${STORAGE_KEY}_${address}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTransactions(parsed);
      } catch {
        setTransactions([]);
      }
    }
  }, [address]);

  // Save to localStorage when transactions change
  useEffect(() => {
    if (!address || transactions.length === 0) return;
    localStorage.setItem(`${STORAGE_KEY}_${address}`, JSON.stringify(transactions));
  }, [transactions, address]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'timestamp' | 'status'>) => {
    setTransactions((prev) => [
      {
        ...tx,
        timestamp: Date.now(),
        status: 'pending',
      },
      ...prev,
    ]);
  }, []);

  const updateTransaction = useCallback((hash: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.hash === hash ? { ...tx, ...updates } : tx
      )
    );
  }, []);

  const clearHistory = useCallback(() => {
    if (!address) return;
    setTransactions([]);
    localStorage.removeItem(`${STORAGE_KEY}_${address}`);
  }, [address]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    clearHistory,
  };
}
