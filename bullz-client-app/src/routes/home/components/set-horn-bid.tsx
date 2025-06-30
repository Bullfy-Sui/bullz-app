"use client";

import GameController from "@/components/icons/game-controller";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import BullHornBid from "./bull-horn-bid";
import FreeHornBid from "./free-horn-bid";
import LockedHorns from "./locked-horns";
import BottomSheet from "@/components/general/bottom-sheet";

interface SetHornBidProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetHornBid = (props: SetHornBidProps) => {
  // const squadWatch = useWatch({ control: formContext.control, name: "squad" });
  // const wagerAmountWatch = useWatch({
  //   control: formContext.control,
  //   name: "wager_amount",
  // });

  const [isLocked, setIsLocked] = useState(false);

  return (
    <>
      <BottomSheet isOpen={props.isOpen} onClose={props.onClose}>
        <div className="w-[24.375rem] mx-auto ">
          <div className="space-y-[1rem] flex flex-col items-center">
            <GameController />
            <p className="font-offbit text-white text-[1.375rem] font-[700] leading-[100%] tracking-[0.04em]">
              LOCK HORNS
            </p>
          </div>
          {!isLocked && (
            <>
              <Tabs defaultValue="account" className="w-full mx-auto mt-[1rem]">
                <TabsList className="bg-gray-850 mx-auto w-full">
                  <TabsTrigger
                    className="font-offbit rounded-none text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center"
                    value="bull-run"
                  >
                    BULL-RUN
                  </TabsTrigger>
                  <TabsTrigger
                    className="font-offbit rounded-none text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center"
                    value="free-run"
                  >
                    FREE-RUN
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="bull-run" className="px-0">
                  <BullHornBid />
                </TabsContent>
                <TabsContent value="free-run" className="px-0">
                  <FreeHornBid />
                </TabsContent>
              </Tabs>
              <div className="w-full space-y-[1rem] mt-[1rem] ">
                <Button
                  type="button"
                  className="w-full text-[1.0625rem]"
                  onClick={() => setIsLocked(true)}
                >
                  LOCK HORNS
                </Button>
                <Button
                  type="button"
                  className="w-full text-[1.0625rem]"
                  variant={"secondary"}
                >
                  CANCEL
                </Button>
              </div>
            </>
          )}
          {isLocked && <LockedHorns onCancel={() => props.onClose()} />}
        </div>
      </BottomSheet>
    </>
  );
};

export default SetHornBid;
