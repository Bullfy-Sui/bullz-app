import { BASE_AXIOS, HttpClient } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { PriceListResponse } from "./types";

// All working coin addresses for the price list (with corrected CETUS address)
const DEFAULT_COIN_ADDRESSES = [
  "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  "0x2::sui::SUI",
  "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
  "0x32a976482bf4154961bf20bfa3567a80122fdf8e8f8b28d752b609d8640f7846::miu::MIU"
];

// Optimized hook for getting all token prices in a single request with real-time updates
export const useGetPriceList = () => {
  return useQuery({
    queryKey: ["token-price-list"],
    queryFn: async () => {
      return await HttpClient.get<PriceListResponse>(BASE_AXIOS, {
        url: "/coins/market-data",
        params: {
          addresses: DEFAULT_COIN_ADDRESSES.join(",")
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
