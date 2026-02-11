import { useState, useCallback } from 'react';

interface DemoTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  from: string;
  to: string;
  amount: string;
  token: string;
  timestamp: number;
}

// Simulates a complete swap transaction for demo purposes
export function useDemoSwap() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transaction, setTransaction] = useState<DemoTransaction | null>(null);
  const [progress, setProgress] = useState(0);

  const executeDemoSwap = useCallback(async (
    from: string,
    amount: string,
    token: string,
    _expectedOutput: string
  ) => {
    setIsPending(true);
    setIsSuccess(false);
    setProgress(0);

    // Generate fake transaction hash
    const hash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const tx: DemoTransaction = {
      hash,
      status: 'pending',
      from,
      to: '0x49ca4100912D413dA17C6B550bf124F5cEBEbC10', // Router V2
      amount,
      token,
      timestamp: Date.now(),
    };

    setTransaction(tx);

    // Simulate transaction progress
    const steps = [
      { progress: 10, delay: 300 },
      { progress: 25, delay: 600 },
      { progress: 40, delay: 900 },
      { progress: 60, delay: 1200 },
      { progress: 80, delay: 1500 },
      { progress: 100, delay: 2000 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay - (steps[steps.indexOf(step) - 1]?.delay || 0)));
      setProgress(step.progress);
    }

    // Success!
    setIsPending(false);
    setIsSuccess(true);
    setTransaction(prev => prev ? { ...prev, status: 'success' } : null);

    return hash;
  }, []);

  const reset = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setTransaction(null);
    setProgress(0);
  }, []);

  return {
    executeDemoSwap,
    isPending,
    isSuccess,
    transaction,
    progress,
    reset,
  };
}
