"use client";

import GameController from "@/components/icons/game-controller";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import BullHornBid from "./bull-horn-bid";
import FreeHornBid from "./free-horn-bid";
import LockedHorns from "./locked-horns";
import BottomSheet from "@/components/general/bottom-sheet";
import { useCreateBid } from "@/lib/hooks/use-squad-contract";
import { HornForm } from "../index";

interface SetHornBidProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetHornBid = (props: SetHornBidProps) => {
  const formContext = useFormContext<HornForm>();
  const createBid = useCreateBid();
  
  const squadWatch = useWatch({ control: formContext.control, name: "squad" });
  const wagerAmountWatch = useWatch({
    control: formContext.control,
    name: "wager_amount",
  });
  const timeLimitWatch = useWatch({
    control: formContext.control,
    name: "time_limit",
  });

  const [isLocked, setIsLocked] = useState(false);
  const [currentTab, setCurrentTab] = useState("bull-run");

  const handleLockHorns = async () => {
    try {
      if (!squadWatch?.squad?.id) {
        console.error("No squad selected");
        return;
      }

      if (currentTab === "bull-run") {
        // Bull-run mode: Create actual bid with wager
        if (!wagerAmountWatch || !timeLimitWatch) {
          console.error("Missing wager amount or time limit");
          return;
        }

        // Convert time from seconds to minutes (assuming the input is in seconds)
        const timeInMinutes = Math.max(1, Math.floor(timeLimitWatch / 60));
        
        console.log("Creating bid:", {
          squadId: Number(squadWatch.squad.id),
          bidAmountInSui: Number(wagerAmountWatch),
          durationInMinutes: timeInMinutes,
        });

        await createBid.mutateAsync({
          squadId: Number(squadWatch.squad.id),
          bidAmountInSui: Number(wagerAmountWatch),
          durationInMinutes: timeInMinutes,
        });

        console.log("Bid created successfully!");
      } else {
        // Free-run mode: Just simulate locking without real bid
        console.log("Free-run mode: No real bid created");
      }
      
      setIsLocked(true);
    } catch (error) {
      console.error("Failed to lock horns:", error);
      // Keep the modal open on error so user can try again
    }
  };

  return (
    <>
      <BottomSheet isOpen={props.isOpen} onClose={props.onClose}>
        <div>
          <div className="space-y-[1rem] flex flex-col items-center">
            <GameController />
            <p className="font-offbit text-white text-[1.375rem] font-[700] leading-[100%] tracking-[0.04em]">
              LOCK HORNS
            </p>
          </div>
          {!isLocked && (
            <>
              <Tabs
                defaultValue="bull-run"
                value={currentTab}
                onValueChange={setCurrentTab}
                className="w-full mx-auto mt-[1rem]"
              >
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
                  onClick={handleLockHorns}
                  disabled={createBid.isPending}
                >
                  {createBid.isPending ? "CREATING BID..." : "LOCK HORNS"}
                </Button>
                <Button
                  type="button"
                  className="w-full text-[1.0625rem]"
                  variant={"secondary"}
                  onClick={props.onClose}
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
