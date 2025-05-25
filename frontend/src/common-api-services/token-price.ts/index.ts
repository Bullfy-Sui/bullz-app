import { BASE_AXIOS, HttpClient } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { PriceListResponse } from "./types";

export const useGetPriceList = () => {
  return useQuery({
    queryKey: ["token-price-list"],
    queryFn: () =>
      HttpClient.get<PriceListResponse>(BASE_AXIOS, {
        url: "/tokens/price-list",
      }),
    refetchInterval: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
};
