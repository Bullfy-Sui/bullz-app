import { BASE_AXIOS, HttpClient } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { PriceListResponse } from "./types";

// Default coin addresses for the price list
const DEFAULT_COIN_ADDRESSES = [
  "0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  "0x2::sui::SUI",
  "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
  "0x32a976482bf4154961bf20bfa3567a80122fdf8e8f8b28d752b609d8640f7846::miu::MIU"
];

export const useGetPriceList = () => {
  return useQuery({
    queryKey: ["token-price-list"],
    queryFn: () =>
      HttpClient.get<PriceListResponse>(BASE_AXIOS, {
        url: "/coins/market-data",
        params: {
          addresses: DEFAULT_COIN_ADDRESSES.join(",")
        }
      }),
    refetchInterval: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
};
