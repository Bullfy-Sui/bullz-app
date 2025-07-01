import { BASE_AXIOS, HttpClient } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { PriceListResponse } from "./types";

export const useGetPriceList = () => {
  return useQuery({
    queryKey: ["token-price-list"],
    queryFn: async () => {
      return await HttpClient.get<PriceListResponse>(BASE_AXIOS, {
        url: "/tokens/price-list",
      });
    },
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
  });
};
