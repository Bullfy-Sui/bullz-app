import { useGetPriceList } from "@/common-api-services/token-price.ts";
import TokenCard from "@/components/general/token/card";
import { Button } from "@/components/ui/button";
import EmptyPlayerButton from "./empty-player-button";

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
              <EmptyPlayerButton
                multiplier={multiplier}
                onClick={() => {}}
                pos={position}
              />
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
