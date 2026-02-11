import { useState, useEffect } from 'react';

const ETH_PRICE_API = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

export function useEthPrice() {
  const [ethPrice, setEthPrice] = useState<number>(2000); // Default fallback
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(ETH_PRICE_API);
        if (!response.ok) throw new Error('Failed to fetch price');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
        setError(null);
      } catch (err) {
        console.error('Error fetching ETH price:', err);
        setError('Using cached price');
        // Keep previous price or use fallback
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchPrice();

    // Refresh every 60 seconds
    const interval = setInterval(fetchPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  return { ethPrice, isLoading, error };
}

// Helper to format USD value from WETH amount
export function formatUsdValue(wethAmount: string | number, ethPrice: number): string {
  const amount = typeof wethAmount === 'string' ? parseFloat(wethAmount) : wethAmount;
  if (isNaN(amount)) return '$0.00';
  const usdValue = amount * ethPrice;
  
  if (usdValue >= 1000000) {
    return `$${(usdValue / 1000000).toFixed(2)}M`;
  } else if (usdValue >= 1000) {
    return `$${(usdValue / 1000).toFixed(2)}K`;
  }
  return `$${usdValue.toFixed(2)}`;
}
