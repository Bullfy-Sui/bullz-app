import { formationLayouts } from "./constants";

export interface IPlayer {
  allocated_value: number;
  name: string;
  position: number;
  token_price_id: string;
}
export type FormationLayoutKey = keyof typeof formationLayouts;
export interface SquadForm {
  name: string;
  formation: FormationLayoutKey;
  players: IPlayer[];
  // wallet_address: string;
}
