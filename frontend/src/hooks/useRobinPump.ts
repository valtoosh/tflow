import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ROBIN_PUMP_ADAPTER_ABI, ROBIN_PUMP_ADAPTER_ADDRESS } from '../abis/RobinPumpAdapter';
import { TIGER_FLOW_ROUTER_V2_ABI, TIGER_FLOW_ROUTER_V2_ADDRESS } from '../abis/TigerFlowRouterV2';

// Custom error messages for RobinPump errors
const ROBIN_PUMP_ERRORS: Record<string, string> = {
  'InvalidFactory': 'Invalid factory address',
  'InvalidRouter': 'Invalid router address',
  'InvalidToken': 'Invalid token address',
  'InvalidAmount': 'Invalid trade amount',
  'TradeTooSmall': 'Trade amount too small (min 0.001 ETH)',
  'TradeTooLarge': 'Trade amount too large (max 100 ETH)',
  'PoolNotFound': 'Token not found on RobinPump',
  'PoolAlreadyGraduated': 'Token has already graduated to Uniswap',
  'InsufficientOutput': 'Slippage exceeded - try increasing slippage tolerance',
  'TransferFailed': 'Token transfer failed',
  'ETHTransferFailed': 'ETH transfer failed',
  'SlippageExceeded': 'Price moved too much - try again',
  'PriceManipulationDetected': 'Price manipulation detected - trade blocked for safety',
};

export function getRobinPumpErrorMessage(error: Error | null): string {
  if (!error) return 'Unknown error';
  
  const message = error.message;
  
  // Check for custom errors
  for (const [errorName, userMessage] of Object.entries(ROBIN_PUMP_ERRORS)) {
    if (message.includes(errorName)) {
      return userMessage;
    }
  }
  
  // Check for common errors
  if (message.includes('user rejected')) return 'Transaction rejected by user';
  if (message.includes('insufficient funds')) return 'Insufficient ETH for gas';
  if (message.includes('nonce')) return 'Transaction nonce error - please retry';
  
  return message;
}

export interface RobinPumpToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  timeSinceLaunch: string;
  isHot: boolean;
  isGraduated: boolean;
}

export interface RobinPumpQuote {
  tokensOut: bigint;
  price: bigint;
  usdcAmount: bigint;
  minTokensOut: bigint;
  slippageBps: number;
}

export function useRobinPumpStatus(tokenAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: ROBIN_PUMP_ADAPTER_ADDRESS.baseSepolia,
    abi: ROBIN_PUMP_ADAPTER_ABI,
    functionName: 'hasActivePool',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    hasActivePool: data ?? false,
    isLoading,
    error: error ? getRobinPumpErrorMessage(error) : null,
  };
}

export function useRobinPumpQuote(tokenAddress: string | undefined, usdcAmount: string) {
  const parsedAmount = usdcAmount ? parseUnits(usdcAmount, 6) : 0n;
  
  const { data, isLoading, error } = useReadContract({
    address: ROBIN_PUMP_ADAPTER_ADDRESS.baseSepolia,
    abi: ROBIN_PUMP_ADAPTER_ABI,
    functionName: 'getBuyQuote',
    args: tokenAddress && parsedAmount > 0n 
      ? [tokenAddress as `0x${string}`, parsedAmount] 
      : undefined,
    query: {
      enabled: !!tokenAddress && parsedAmount > 0n,
    },
  });

  return {
    quote: data,
    isLoading,
    error: error ? getRobinPumpErrorMessage(error) : null,
  };
}

export function useRobinPumpPrice(tokenAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: ROBIN_PUMP_ADAPTER_ADDRESS.baseSepolia,
    abi: ROBIN_PUMP_ADAPTER_ABI,
    functionName: 'getCurrentPrice',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    price: data,
    isLoading,
    error: error ? getRobinPumpErrorMessage(error) : null,
  };
}

export function useExecuteRobinPumpBuy() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const executeBuy = useCallback(async (
    tokenAddress: string,
    usdcAmount: string,
    minTokensOut: string,
    slippageBps: number = 500
  ) => {
    setIsPending(true);
    setError(null);
    
    try {
      const parsedUsdc = parseUnits(usdcAmount, 6);
      const parsedMinTokens = parseUnits(minTokensOut, 18);
      
      // Validate inputs
      if (parsedUsdc < parseUnits('100', 6)) {
        throw new Error('Minimum trade size is 100 USDC');
      }
      
      if (parsedUsdc > parseUnits('1000000', 6)) {
        throw new Error('Maximum trade size is 1,000,000 USDC');
      }
      
      if (slippageBps > 400) {
        throw new Error('Maximum slippage is 4%');
      }

      writeContract({
        address: TIGER_FLOW_ROUTER_V2_ADDRESS.baseSepolia,
        abi: TIGER_FLOW_ROUTER_V2_ABI,
        functionName: 'executeSwap',
        args: [
          tokenAddress as `0x${string}`,
          parsedUsdc,
          parsedMinTokens,
          BigInt(Math.floor(Date.now() / 1000) + 300), // 5 min deadline
          [], // allocations - will be populated by router
        ],
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(getRobinPumpErrorMessage(err instanceof Error ? err : null));
      setIsPending(false);
    }
  }, [writeContract]);

  return {
    executeBuy,
    hash,
    isPending: isPending || isWritePending || isConfirming,
    isSuccess,
    error,
    reset: () => {
      setError(null);
      setIsPending(false);
    },
  };
}

// Hook for getting optimal route across all sources
export function useOptimalRoute(tokenAddress: string | undefined, usdcAmount: string) {
  const parsedAmount = usdcAmount ? parseUnits(usdcAmount, 6) : 0n;
  
  const { data, isLoading, error } = useReadContract({
    address: TIGER_FLOW_ROUTER_V2_ADDRESS.baseSepolia,
    abi: TIGER_FLOW_ROUTER_V2_ABI,
    functionName: 'getQuote',
    args: tokenAddress && parsedAmount > 0n 
      ? [tokenAddress as `0x${string}`, parsedAmount] 
      : undefined,
    query: {
      enabled: !!tokenAddress && parsedAmount > 0n,
    },
  });

  return {
    route: data?.[0], // RouteQuote
    uniswapOnly: data?.[1], // Uniswap-only comparison
    isLoading,
    error: error ? getRobinPumpErrorMessage(error) : null,
  };
}
