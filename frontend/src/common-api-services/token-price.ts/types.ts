export interface PriceListResponse {
  data: TokenResponse[];
  message: string;
  status: number;
}

export interface TokenResponse {
  fluctuation_pct: number;
  name: string;
  price_1m: number;
  price_30s: number;
  timestamp: number;
  token_id: string;
  token_symbol: string;
}
