import TitleBar from "@/components/general/title-bar";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { TOTAL_BUDGET } from "../constants";
import { SquadForm } from "../types";
import AllocationItem from "./allocation-item";

interface AllocateFundsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AllocateFunds = (props: AllocateFundsProps) => {
  const formContext = useFormContext<SquadForm>();
  const playerArray = useFieldArray({
    control: formContext.control,
    name: "players",
  });
  const playerArrayWatch = useWatch({
    control: formContext.control,
    name: "players",
  });
  // const [remainingBudget, setRemainingBudget] = useState(
  //   TOTAL_BUDGET - playerArrayWatch?.reduce((a, b) => a + b.allocated_value, 0)
  // );

  const total_squad_value = playerArrayWatch?.reduce(
    (a, b) => a + b.allocated_value,
    0
  );

  return (
    <Sheet open={props.isOpen}>
      <SheetContent side="bottom" className="border-none h-screen">
        <div className="w-[24.375rem] mx-auto px-[1.25rem] overflow-y-scroll">
          <TitleBar title="Allocation of funds" onClick={props.onClose} />
          <div className="bg-modal-bg rounded-[0.375rem] w-full flex items-center justify-between h-[4.25rem] px-[0.75rem] py-[0.875rem]">
            <div>
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-profit-foreground block">
                Budget
              </span>
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-white block">
                {/* ${remainingBudget.toLocaleString()} */}$
                {(TOTAL_BUDGET - total_squad_value).toLocaleString()}
              </span>
            </div>
            <div className="w-[8.5rem] ">
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-loss-foreground block">
                Allocation
              </span>
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-white block">
                {((total_squad_value / TOTAL_BUDGET) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="space-y-[0.25rem] mt-[0.76rem] h-[60dvh] overflow-y-scroll">
            {playerArrayWatch?.map((player, index) => (
              <AllocationItem
                key={player.name}
                value={player.allocated_value}
                name={player.name}
                onSlide={(value) => {
                  playerArray.update(index, {
                    ...playerArrayWatch[index],
                    allocated_value: value,
                  });
                  // setAllocated((value / TOTAL_BUDGET) * 100);
                  // setRemainingBudget(TOTAL_BUDGET - value);
                }}
              />
            ))}
          </div>
          <div className="bg-background pt-[1.25rem]">
            <FormField
              control={formContext.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Enter Your team Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="border-none bg-gray-800"
                      placeholder="Give your team a name"
                      {...field}
                    />
                  </FormControl>
                  {/* <FormDescription>
              Give your team a name
              </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              form="create-squad-form"
              className="w-full h-[4rem] mt-[2rem]"
            >
              Create team
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AllocateFunds;
