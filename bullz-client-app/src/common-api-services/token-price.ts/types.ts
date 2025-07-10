// Updated types to match the actual API response structure
export type PriceListResponse = TokenResponse[];

export interface TokenResponse {
  coinAddress: string;
  imageUrl: string;
  name: string;
  symbol: string;
  decimals: string;
  currentPrice: string;
  price5mAgo: string;
  price1hAgo: string;
  percentagePriceChange5m: string;
  percentagePriceChange1h: string;
}
