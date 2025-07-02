import EmptyPitch from "@/components/svg/pitch/empty-pitch";
import { IPlayer } from "../types";
import Player from "./player";
import EmptyPlayerButton from "./empty-player-button";
import { Button } from "@/components/ui/button";

export type Postition = number;
export type Multiplier = number;

interface PitchProps {
  layout: number[][][];
  players?: IPlayer[];
  onPlayerClick: (player: IPlayer) => void;
  onEmptyPlayerClick?: (pos: [Postition, Multiplier]) => void;
  ctaLabel: string;
  ctaOnClick?: () => void;
}

const Pitch = (props: PitchProps) => {
  console.log("🏟️ Pitch render:", {
    layout: props.layout,
    players: props.players,
    hasLayout: !!props.layout,
    hasPlayers: !!props.players,
    playersCount: props.players?.length || 0
  });

  return (
    <main className="relative flex flex-col   items-center ">
      <div className="absolute h-[33.8125rem] w-[23.375rem] flex flex-col gap-[1rem] pt-[4rem] mx-auto">
        {props.layout?.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-[3.125rem]">
            {row.map(([pos, multiplier]) => {
              const player = props.players?.find((p) => p.position === pos);
              console.log(`🔍 Position ${pos} (${multiplier}x):`, player ? `Found ${player.name}` : "Empty");
              return player ? (
                <Player
                  key={player.position}
                  multiplier={multiplier}
                  player={player}
                  onClick={() => props.onPlayerClick(player)}
                />
              ) : (
                <EmptyPlayerButton
                  key={pos}
                  pos={pos}
                  multiplier={multiplier}
                  onClick={() =>
                    props.onEmptyPlayerClick &&
                    props.onEmptyPlayerClick([pos, multiplier])
                  }
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className=" h-[33.8125rem]">
        <EmptyPitch />
      </div>
      {props.ctaOnClick && (
        <div className="px-[1.5rem] w-full -mt-[2rem]">
          <Button
            type="button"
            onClick={props.ctaOnClick}
            className=" w-full  z-10 cursor-pointer hover:bg-button-bg"
          >
            {props.ctaLabel}
          </Button>
        </div>
      )}
    </main>
  );
};

export default Pitch;
