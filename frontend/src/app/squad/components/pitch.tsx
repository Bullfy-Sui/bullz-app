import EmptyPitch from "@/components/svg/pitch/empty-pitch";
import { IPlayer } from "../types";
import Player from "./player";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PitchProps {
  layout: number[][];
  players?: IPlayer[];
  onPlayerClick: (player: IPlayer) => void;
  onEmptyPlayerClick?: (position: number) => void;
  showInstructions?: boolean;
  onInstructionsClose?: () => void;
}

const Pitch = (props: PitchProps) => {
  return (
    <main className="relative flex flex-col flex-1 items-center">
      {/* Instructions Popup (unchanged) */}
      {props.showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-sm rounded-lg p-6 text-center" style={{ backgroundColor: '#000019' }}>
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400">
                <svg
                  className="h-6 w-6 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" />
                </svg>
              </div>
            </div>
            <p className="mb-6 text-lg font-medium text-gray-300 leading-relaxed">
              CHOOSE A FORMATION ABOVE, THEN TAP A POSITION BELOW TO ADD OR CHANGE A TOKEN. WHEN ALL POSITIONS ARE SET, CLICK CONTINUE.
            </p>
            <button
              onClick={props.onInstructionsClose}
              className="w-full rounded bg-gray-700 px-6 py-3 text-lg font-medium text-gray-300 hover:bg-gray-600 transition-colors"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Critical adjustment: Updated positioning and sizing */}
      <div className="absolute h-[33rem] w-[23.375rem] flex flex-col gap-[2.8rem] pt-[3.8rem] mx-auto">
        {props.layout?.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-[3.1rem]">
            {row.map((pos) => {
              const player = props.players?.find((p) => p.position === pos);
              return player ? (
                <Player
                  key={player.position}
                  player={player}
                  onClick={() => props.onPlayerClick(player)}
                />
              ) : (
                <div
                  key={pos}
                  className="w-[5.5rem] h-[5.5rem] bg-[#E9E4E4] cursor-pointer rounded-full flex items-center justify-center hover:bg-[#D5D0D0] transition-colors"
                  style={{ filter: 'drop-shadow(0px 12px 20px rgba(0, 0, 0, 0.4))' }}
                  onClick={() => props.onEmptyPlayerClick && props.onEmptyPlayerClick(pos)}
                >
                  <Plus className="w-8 h-8 text-gray-600" />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="h-[35.6rem]">
        <EmptyPitch />
      </div>
    </main>
  );
};

export default Pitch;

