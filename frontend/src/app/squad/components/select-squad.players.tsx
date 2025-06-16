import { useGetPriceList } from "@/common-api-services/token-price.ts";
import { TokenResponse } from "@/common-api-services/token-price.ts/types";
import TokenCard from "@/components/general/token/card";
import PlusIcon from "@/components/icons/plus.icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { SquadForm } from "../types";
import Player from "./player";
import { Multiplier, Postition } from "./pitch";

interface Props {
  list: number[][];
  onClose: () => void;
  initialFocusedPosition?: [Postition, Multiplier];
}

const SelectSquadPlayers = (props: Props) => {
  console.log(props);
  const { data: priceListResponse } = useGetPriceList();
  const [focusedPosition, setFocusedPosition] = useState<
    [Postition, Multiplier]
  >(props.initialFocusedPosition ?? [1, 2.0]);
  const { getValues, control } = useFormContext<SquadForm>();
  // const formation = getValues("formation");
  const playerArray = useFieldArray({ control: control, name: "players" });
  const playerArrayWatch = useWatch({ control: control, name: "players" });

  const handlePlayerSelect = (token: TokenResponse) => {
    const foundPlayer = playerArrayWatch?.find(
      (player) => player.position === focusedPosition[0]
    );
    console.log(
      foundPlayer,
      focusedPosition,
      token,
      playerArray.fields,
      playerArray.fields.length
    );

    if (foundPlayer)
      playerArray.update(playerArrayWatch.indexOf(foundPlayer), {
        ...foundPlayer,
        name: token.token_symbol,
        token_price_id: token.token_id,
      });

    if (playerArray.fields.length < 7 && !foundPlayer) {
      playerArray.append({
        position: focusedPosition[0],
        name: token.token_symbol,
        token_price_id: token.token_id,
        multiplier: focusedPosition[1],
      });
      console.log(playerArray.fields);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-[1.5rem] mt-[3rem]">
        <Button
          variant={"secondary"}
          className="h-[2.5rem]"
          onClick={props.onClose}
        >
          BACK
        </Button>
        <Button className="h-[2.5rem]" onClick={props.onClose}>
          DONE
        </Button>
      </div>

      <div className="flex gap-[1rem]">
        <div className="flex flex-col w-[6rem]  overflow-y-scroll">
          {props.list.map(([position, multiplier]) => {
            const player = playerArrayWatch.find(
              (p) => p.position === position
            );
            return (
              <div
                onClick={() => setFocusedPosition([position, multiplier])}
                key={position}
                className={cn(
                  " h-[8rem] bg-gray-850 p-[0.75rem] border border-gray-700 flex items-center justify-center",
                  {
                    "bg-gray-700": position === focusedPosition[0],
                  }
                )}
              >
                {player ? (
                  <Player
                    key={position}
                    multiplier={multiplier}
                    player={player}
                    onClick={() => {}}
                  />
                ) : (
                  <div className="flex flex-col-reverse items-center justify-center w-max">
                    <div
                      style={{
                        boxShadow:
                          "0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF29 inset, 0px 12px 20px 0px #00000066",
                      }}
                      className={cn(
                        "w-[4rem] h-[4rem] rounded-full bg-white cursor-pointer border-[4.4px] border-gray-100 flex items-center justify-center "
                      )}
                      // onClick={() => props.onClick && props.onClick(props.pos)}
                    >
                      <PlusIcon color="#474766" />
                    </div>

                    <div className="border-[0.5px] mb-[-1.25rem] border-gray-300 w-[1.875rem] text-center text-[0.875rem] py-[0.375rem] px-[0.25rem] rounded-full font-offbit text-black font-[700] leading-[100%] tracking-[0.04em] bg-white h-[1.375rem] flex items-center justify-center">
                      {multiplier}x
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className=" h-[50rem] overflow-y-scroll">
          {priceListResponse?.data.map((token) => (
            <TokenCard
              {...token}
              key={token.token_id}
              onClick={() => handlePlayerSelect(token)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default SelectSquadPlayers;
