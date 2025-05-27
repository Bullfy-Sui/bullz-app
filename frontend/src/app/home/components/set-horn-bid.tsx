"use client";

import { HornForm } from "@/app/page";
import Pitch from "@/app/squad/components/pitch";
import { formationLayouts } from "@/app/squad/constants";
import { FormationLayoutKey } from "@/app/squad/types";
import TitleBar from "@/components/general/title-bar";
import CircleMinusIcon from "@/components/icons/circle-minus.icon";
import PlusCircle from "@/components/icons/plus-circle.icon";
import DefaultDp from "@/components/svg/default-dp";
import DefaultPlayerDp from "@/components/svg/default-player-dp";
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
import { useAppStore } from "@/lib/store/app-store";
import { useFormContext, useWatch } from "react-hook-form";

interface SetHornBidProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetHornBid = (props: SetHornBidProps) => {
  const formContext = useFormContext<HornForm>();
  const squadWatch = useWatch({ control: formContext.control, name: "squad" });
  const wagerAmountWatch = useWatch({
    control: formContext.control,
    name: "wager_amount",
  });
  const { address } = useAppStore();

  return (
    <>
      <Sheet open={props.isOpen}>
        {/* <SheetContent side="bottom" className="border-none h-screen "> */}
        <SheetContent
          side="bottom"
          className="border-none h-full overflow-scroll p-0"
        >
          {/* <div className="w-[24.375rem] mx-auto  "> */}
          <div className="w-[24.375rem] mx-auto  ">
            <TitleBar title="Lock Horn" onClick={props.onClose} />

            <Pitch
              layout={
                formationLayouts[
                  squadWatch?.squad.formation as FormationLayoutKey
                ]
              }
              players={squadWatch?.players}
              onPlayerClick={(player) => {
                console.log(player);
              }}
              ctaLabel="Lock horns"
            />

            <div className="bg-[#05051D] p-[1.5rem] w-full  border-t-[0.4px]  border-white/49">
              <FormField
                control={formContext.control}
                name="wager_amount"
                render={({ field }) => (
                  <FormItem className="flex items-center">
                    <FormLabel className="text-white whitespace-nowrap">
                      Set a bid
                    </FormLabel>
                    <div className="flex items-center gap-[0.375rem]">
                      <CircleMinusIcon
                        className="block cursor-pointer"
                        onClick={() =>
                          formContext.setValue(
                            "wager_amount",
                            wagerAmountWatch - 1
                          )
                        }
                      />

                      <FormControl>
                        <Input
                          className="border bg-black text-white "
                          placeholder="Enter amount in SUI"
                          // type="number"
                          {...field}
                        />
                      </FormControl>

                      <PlusCircle
                        className="cursor-pointer size-[2rem]"
                        onClick={() =>
                          formContext.setValue(
                            "wager_amount",
                            wagerAmountWatch + 1
                          )
                        }
                      />
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                form="submit-bid-form"
                className="w-full h-[4rem] mt-[2rem]"
              >
                Submit Bid
              </Button>
            </div>

            <div className="bg-[#05051D] p-[1.5rem] w-full  border-t-[0.4px]  border-white/49">
              <div className="flex items-center justify-between">
                <div>
                  <DefaultPlayerDp />
                  <span className="text-[0.625rem] block leading-[150%] font-[600] w-[4rem] truncate">
                    {address}
                  </span>
                </div>
                <span className="text-[#9898B3] text-[1rem] leading-[150%] font-[400]">
                  Connecting..
                </span>
                <div>
                  <DefaultDp />
                  <span className="text-[0.625rem] text-center block leading-[150%] font-[600] text-[#9898B3]">
                    waiting..
                  </span>
                </div>
              </div>
              <Button className="w-full h-[4rem] mt-[2rem]">
                Cancel request
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SetHornBid;
