import { useGetPriceList } from "@/common-api-services/token-price.ts";
import TokenCard from "@/components/general/token/card";
import { Button } from "@/components/ui/button";
import EmptyPlayerButton from "./empty-player-button";
import PlusIcon from "@/components/icons/plus.icon";
import { cn } from "@/lib/utils";

interface Props {
  list: number[][];
  onClose: () => void;
}

const SelectSquadPlayers = (props: Props) => {
  console.log(props);
  const { data: priceListResponse } = useGetPriceList();
  // const { getValues } = useFormContext<SquadForm>();
  // const formation = getValues("formation");
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
        <div className="flex flex-col h-[50rem] w-max overflow-y-scroll">
          {props.list.map(([position, multiplier]) => (
            <div
              key={position}
              className="w-max h-max bg-gray-700 p-[0.75rem] border border-gray-700"
            >
              <div className="flex flex-col-reverse items-center justify-center ">
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

                <div className="border-[0.5px] mb-[-1.25rem] border-gray-300 w-[3.1875rem] text-center rounded-full font-offbit text-black font-[700] leading-[100%] tracking-[0.04em] bg-white p-[0.5rem] h-[1.75rem] flex items-center justify-center">
                  {multiplier}x
                </div>
              </div>
              {/* <EmptyPlayerButton
                multiplier={multiplier}
                onClick={() => {}}
                pos={position}
                classNames="w-[4rem] h-[4rem]"
              /> */}
            </div>
          ))}
        </div>
        <div className=" h-[50rem] overflow-y-scroll">
          {priceListResponse?.data.map((token) => (
            <TokenCard
              {...token}
              key={token.token_id}
              // @ts-expect-error - -
              onClick={() => props?.onSelect(token)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default SelectSquadPlayers;
