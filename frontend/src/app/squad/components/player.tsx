import SuiLogo from "@/components/svg/sui.logo";
import { IPlayer } from "../types";

const Player = ({
  player,
  onClick,
}: {
  player: IPlayer;
  onClick: () => void;
}) => {
  return (
    <div className="w-[4.375rem] h-[4.375rem]" onClick={onClick}>
      <div className="bg-sui-blue w-full h-full flex items-center justify-center">
        {/* <SolanaLogo /> */}
        <SuiLogo className="size-[2.75rem]" />
      </div>
      <div className="w-full bg-white flex items-center justify-center">
        <span className=" text-black w-full text-sm text-center">
          {player.name}
        </span>
      </div>
    </div>
  );
};

export default Player;
