import { formationLayouts } from "./constants";

export interface IPlayer {
  multiplier: number;
  name: string;
  position: number;
  token_price_id: string;
  imageUrl?: string; // Token image URL for display
  allocated_value?: number; // Budget allocation for this player
}
export type FormationLayoutKey = keyof typeof formationLayouts;
export interface SquadForm {
  name: string;
  formation: FormationLayoutKey;
  players: IPlayer[];
  // wallet_address: string;
}
