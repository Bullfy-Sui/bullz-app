import { BASE_AXIOS, HttpClient } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { PriceListResponse } from "./types";
import { getAllTokenAddresses, getDefaultTokenAddresses } from "./config";

// Optimized hook for getting all token prices in a single request with real-time updates
export const useGetPriceList = (useAllTokens: boolean = true) => {
  const tokenAddresses = useAllTokens ? getAllTokenAddresses() : getDefaultTokenAddresses();
  
  return useQuery({
    queryKey: ["token-price-list", useAllTokens ? "all" : "default"],
    queryFn: async () => {
      return await HttpClient.get<PriceListResponse>(BASE_AXIOS, {
        url: "/coins/market-data",
        params: {
          addresses: tokenAddresses.join(",")
        }
      });
    },
    refetchInterval: 1000 * 30, // 30 seconds for more real-time updates
    refetchOnWindowFocus: true, // Refetch when user returns to the app
    refetchIntervalInBackground: true, // Continue fetching even when tab is not focused
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 1000 * 15, // Consider data stale after 15 seconds for fresher data
  });
};

// Hook for getting individual coin price with real-time updates
export const useGetCoinPrice = (coinAddress: string) => {
  return useQuery({
    queryKey: ["coin-price", coinAddress],
    queryFn: async () => {
      return await HttpClient.get<PriceListResponse>(BASE_AXIOS, {
        url: "/coins/market-data",
        params: {
          addresses: coinAddress
        }
      });
    },
    refetchInterval: 1000 * 30, // 30 seconds for more real-time updates
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 15,
    enabled: !!coinAddress, // Only run if coinAddress is provided
  });
};

// Hook for getting multiple specific coin prices with real-time updates
export const useGetMultipleCoinPrices = (coinAddresses: string[]) => {
  return useQuery({
    queryKey: ["multiple-coin-prices", ...coinAddresses.sort()],
    queryFn: async () => {
      if (!coinAddresses || coinAddresses.length === 0) {
        return [];
      }
      
      return await HttpClient.get<PriceListResponse>(BASE_AXIOS, {
        url: "/coins/market-data",
        params: {
          addresses: coinAddresses.join(",")
        }
      });
    },
    refetchInterval: 1000 * 30, // 30 seconds for more real-time updates
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 15,
    enabled: coinAddresses && coinAddresses.length > 0,
  });
};
