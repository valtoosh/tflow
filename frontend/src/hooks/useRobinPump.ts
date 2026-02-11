import { useState, useCallback, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ROBIN_PUMP_ADAPTER_ABI, ROBIN_PUMP_ADAPTER_ADDRESS } from '../abis/RobinPumpAdapter';
import { TIGER_FLOW_ROUTER_V2_ABI, TIGER_FLOW_ROUTER_V2_ADDRESS } from '../abis/TigerFlowRouterV2';
import { useDemoMode } from './useDemoMode';

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

// Mock route data for demo when wallet is not connected
const MOCK_ROUTE_DATA = {
  route: {
    totalWethOut: 250000000000000000n, // 0.25 WETH for 1000 USDC
    totalUsdcCost: 1000000000n, // 1000 USDC
    robinPumpUsdcAmount: 500000000n, // 500 USDC
    robinPumpWethOut: 125000000000000000n, // 0.125 WETH
    vaultUsdcAmount: 300000000n, // 300 USDC
    vaultWethOut: 75000000000000000n, // 0.075 WETH
    uniswapUsdcAmount: 200000000n, // 200 USDC
    uniswapWethOut: 50000000000000000n, // 0.05 WETH
    totalFees: 2500000n, // 2.5 USDC
    savingsVsUniswap: 20000000000000000n, // 0.02 WETH savings
    allocations: [
      { sourceType: 0, source: '0xEAe4659bC849dd82938AF8b93edD87A64178f00e' as `0x${string}`, wethAmount: 125000000000000000n, usdcCost: 500000000n, fee: 1500000n }, // RobinPump 50%
      { sourceType: 1, source: '0xaF9b0ebc6B03F199EBCD7C9EEcd00bEdc54e3C76' as `0x${string}`, wethAmount: 75000000000000000n, usdcCost: 300000000n, fee: 750000n },  // Vault 30%
      { sourceType: 2, source: '0x0000000000000000000000000000000000000000' as `0x${string}`, wethAmount: 50000000000000000n, usdcCost: 200000000n, fee: 250000n },  // Uniswap 20%
    ],
  },
  uniswapOnly: {
    totalWethOut: 230000000000000000n, // 0.23 WETH (8% worse)
    totalUsdcCost: 1000000000n,
    robinPumpUsdcAmount: 0n,
    robinPumpWethOut: 0n,
    vaultUsdcAmount: 0n,
    vaultWethOut: 0n,
    uniswapUsdcAmount: 1000000000n,
    uniswapWethOut: 230000000000000000n,
    totalFees: 5000000n,
    savingsVsUniswap: 0n,
    allocations: [
      { sourceType: 2, source: '0x0000000000000000000000000000000000000000' as `0x${string}`, wethAmount: 230000000000000000n, usdcCost: 1000000000n, fee: 5000000n },
    ],
  },
};

// Hook to fetch real ETH price for demo calculations
function useEthPriceForDemo() {
  const [ethPrice, setEthPrice] = useState<number>(2500); // Default $2500
  
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (err) {
        console.error('Failed to fetch ETH price:', err);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  return ethPrice;
}

// Hook for getting optimal route across all sources
export function useOptimalRoute(tokenAddress: string | undefined, usdcAmount: string) {
  const parsedAmount = usdcAmount ? parseUnits(usdcAmount, 6) : 0n;
  const { isDemoMode } = useDemoMode();
  const ethPrice = useEthPriceForDemo();
  
  const { data, isLoading, error } = useReadContract({
    address: TIGER_FLOW_ROUTER_V2_ADDRESS.baseSepolia,
    abi: TIGER_FLOW_ROUTER_V2_ABI,
    functionName: 'getQuote',
    args: tokenAddress && parsedAmount > 0n && !isDemoMode
      ? [tokenAddress as `0x${string}`, parsedAmount] 
      : undefined,
    query: {
      enabled: !!tokenAddress && parsedAmount > 0n && !isDemoMode,
    },
  });

  // Return mock data for demo to show the full multi-source workflow
  const shouldShowMock = isDemoMode && !!tokenAddress && parsedAmount > 0n;
  
  if (shouldShowMock) {
    // Calculate WETH output based on real ETH price
    // 1 WETH = ethPrice USDC, so USDC amount / ethPrice = WETH amount
    const usdcAmountNum = Number(parsedAmount) / 1e6; // Convert from 6 decimals
    const wethAmount = usdcAmountNum / ethPrice; // WETH amount
    const wethAmountWei = BigInt(Math.floor(wethAmount * 1e18)); // Convert to wei
    
    // Split across sources: 50% RobinPump, 30% Vault, 20% Uniswap
    const robinPumpWeth = wethAmountWei * 50n / 100n;
    const vaultWeth = wethAmountWei * 30n / 100n;
    const uniswapWeth = wethAmountWei * 20n / 100n;
    
    const robinPumpUsdc = parsedAmount * 50n / 100n;
    const vaultUsdc = parsedAmount * 30n / 100n;
    const uniswapUsdc = parsedAmount * 20n / 100n;
    
    // Uniswap-only gets 8% less (higher slippage)
    const uniswapOnlyWeth = wethAmountWei * 92n / 100n;
    
    const scaledRoute = {
      ...MOCK_ROUTE_DATA.route,
      totalWethOut: wethAmountWei,
      totalUsdcCost: parsedAmount,
      robinPumpUsdcAmount: robinPumpUsdc,
      robinPumpWethOut: robinPumpWeth,
      vaultUsdcAmount: vaultUsdc,
      vaultWethOut: vaultWeth,
      uniswapUsdcAmount: uniswapUsdc,
      uniswapWethOut: uniswapWeth,
      totalFees: parsedAmount * 25n / 10000n, // 0.25% fee
      savingsVsUniswap: wethAmountWei - uniswapOnlyWeth,
      allocations: [
        { sourceType: 0, source: '0xEAe4659bC849dd82938AF8b93edD87A64178f00e' as `0x${string}`, wethAmount: robinPumpWeth, usdcCost: robinPumpUsdc, fee: robinPumpUsdc * 15n / 10000n },
        { sourceType: 1, source: '0xaF9b0ebc6B03F199EBCD7C9EEcd00bEdc54e3C76' as `0x${string}`, wethAmount: vaultWeth, usdcCost: vaultUsdc, fee: vaultUsdc * 10n / 10000n },
        { sourceType: 2, source: '0x0000000000000000000000000000000000000000' as `0x${string}`, wethAmount: uniswapWeth, usdcCost: uniswapUsdc, fee: uniswapUsdc * 5n / 10000n },
      ],
    };
    const scaledUniswap = {
      ...MOCK_ROUTE_DATA.uniswapOnly,
      totalWethOut: uniswapOnlyWeth,
      totalUsdcCost: parsedAmount,
      robinPumpUsdcAmount: 0n,
      robinPumpWethOut: 0n,
      vaultUsdcAmount: 0n,
      vaultWethOut: 0n,
      uniswapUsdcAmount: parsedAmount,
      uniswapWethOut: uniswapOnlyWeth,
      totalFees: parsedAmount * 5n / 1000n, // 0.5% fee
      savingsVsUniswap: 0n,
      allocations: [
        { sourceType: 2, source: '0x0000000000000000000000000000000000000000' as `0x${string}`, wethAmount: uniswapOnlyWeth, usdcCost: parsedAmount, fee: parsedAmount * 5n / 1000n },
      ],
    };
    
    return {
      route: scaledRoute,
      uniswapOnly: scaledUniswap,
      isLoading: false,
      error: null,
      isMock: true,
    };
  }

  return {
    route: data?.[0], // RouteQuote
    uniswapOnly: data?.[1], // Uniswap-only comparison
    isLoading,
    error: error ? getRobinPumpErrorMessage(error) : null,
    isMock: false,
  };
}
