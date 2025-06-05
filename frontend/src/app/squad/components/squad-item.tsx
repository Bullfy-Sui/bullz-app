import SuiLogo from "@/components/svg/sui.logo";
import { SquadResponseItem } from "../api-services/types";
import { cn } from "@/lib/utils";
import CirclePlusIcon from "@/components/icons/circle-plus.icon";

interface SquadItemProps {
  onClick: () => void;
  team: SquadResponseItem;
}

const SquadItem = (props: SquadItemProps) => {
  return (
    <>
      <div
        onClick={props.onClick}
        className="bg-[#000019] cursor-pointer border-[0.81px] border-white flex flex-col  gap-[1rem] px-[0.9375rem] rounded-[0.403125rem] py-[0.638125rem] pb-[1.70875rem] w-[8.0625rem]"
        style={{
          boxShadow: "1.61px 1.61px 6.45px 0px #FEBF1899 inset",
        }}
      >
        <span className="text-[#D2CACA] text-[0.75rem] font-[400] leading-[100%] mb-[1.475rem]">
          {props.team.squad.name}
        </span>
        <div className="flex items-center w-[5.685rem]">
          {props.team.players.slice(0, 3).map((player, index) => (
            <span
              key={player.id}
              className={cn("size-[1.875rem] rounded-full", {
                "-ml-3": index !== 0,
              })}
            >
              <SuiLogo className="size-[1.875rem] rounded-full" />
            </span>
          ))}

          <span
            className={cn(
              "size-[1.875rem] rounded-full bg-white -ml-3 text-black flex items-center justify-center"
            )}
          >
            <CirclePlusIcon />
            {props.team.players.slice(3, props.team.players.length).length}
          </span>
        </div>
      </div>
    </>
  );
};

export default SquadItem;
