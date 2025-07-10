export interface SquadResponse {
  data: SquadResponseItem[];
  message: string;
  status: number;
}

export interface SquadResponseItem {
  players: PlayerResponse[];
  squad: Squad;
}

interface Squad {
  created_at: string;
  formation: string;
  id: string;
  name: string;
  owner_id: string;
  total_value: number;
  updated_at: string;
  wallet_address: string;
}

export interface PlayerResponse {
  multiplier: number;
  id: string;
  name: string;
  position: number;
  squad_id: string;
  token_price_id: string;
  imageUrl?: string; // Token image URL for display
}
