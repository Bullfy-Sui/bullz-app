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
  const { data: priceList, isLoading, error, isError } = useGetPriceList();
  const [focusedPosition, setFocusedPosition] = useState<
    [Postition, Multiplier]
  >(props.initialFocusedPosition ?? [1, 2.0]);
  const { control } = useFormContext<SquadForm>();
  const playerArray = useFieldArray({ control: control, name: "players" });
  const playerArrayWatch = useWatch({ control: control, name: "players" });

  const handlePlayerSelect = (token: TokenResponse) => {
    const foundPlayer = playerArrayWatch?.find(
      (player) => player.position === focusedPosition[0]
    );

    if (foundPlayer)
      playerArray.update(playerArrayWatch.indexOf(foundPlayer), {
        ...foundPlayer,
        name: token.symbol,
        token_price_id: token.coinAddress,
        imageUrl: token.imageUrl,
      });

    if (playerArray.fields.length < 7 && !foundPlayer) {
      playerArray.append({
        position: focusedPosition[0],
        name: token.symbol,
        token_price_id: token.coinAddress,
        imageUrl: token.imageUrl,
        multiplier: focusedPosition[1],
      });
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
          {/* Show loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-[10rem]">
              <div className="text-gray-400">Loading tokens...</div>
            </div>
          )}
          
          {/* Show error state */}
          {isError && (
            <div className="flex flex-col items-center justify-center h-[10rem] gap-2">
              <div className="text-red-400">Failed to load tokens</div>
              <div className="text-gray-500 text-sm">
                {error?.message || "Unknown error"}
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Show empty state */}
          {!isLoading && !isError && (!priceList || priceList.length === 0) && (
            <div className="flex items-center justify-center h-[10rem]">
              <div className="text-gray-400">No tokens available</div>
            </div>
          )}
          
          {/* Show tokens */}
          {!isLoading && !isError && priceList && priceList.length > 0 && (
            <>
              <div className="mb-2 text-xs text-gray-500">
                {priceList.length} tokens available
              </div>
              {priceList.map((token) => (
                <TokenCard
                  {...token}
                  key={token.coinAddress}
                  onClick={() => handlePlayerSelect(token)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SelectSquadPlayers;
