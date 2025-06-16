import SuiLogo from "@/components/svg/sui.logo";
import { IPlayer } from "../types";

const Player = ({
  player,
  multiplier,
  onClick,
}: {
  player: IPlayer;
  multiplier: number;
  onClick: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="border-[0.5px] mb-[-1.25rem] z-10 border-gray-300 w-[3.1875rem] text-center rounded-full font-offbit text-black font-[700] leading-[100%] tracking-[0.04em] bg-white p-[0.5rem] h-[1.75rem] flex items-center justify-center">
        {multiplier}x
      </div>
      <div
        className="w-[5.5rem] h-[5.5rem] rounded-full border-[4.4px] flex items-center justify-center"
        onClick={onClick}
      >
        <SuiLogo width={88} height={88} className=" rounded-full" />
      </div>

      <div className="w-full h-[1.9375rem] bg-white rounded-full flex items-center justify-center -mt-[1.5rem]">
        <span className=" text-black w-full text-[1.375rem]  font-[700] font-offbit leading-[100%] tracking-[0.04em] text-center">
          {player.name}
        </span>
      </div>
    </div>
  );
};

export default Player;
