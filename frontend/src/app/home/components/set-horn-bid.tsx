"use client";

import { HornForm } from "@/app/page";
import Pitch from "@/app/squad/components/pitch";
import { formationLayouts } from "@/app/squad/constants";
import { FormationLayoutKey } from "@/app/squad/types";
import TitleBar from "@/components/general/title-bar";
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
import { useFormContext, useWatch, ControllerRenderProps } from "react-hook-form";
import { useState } from "react";

interface SetHornBidProps {
  isOpen: boolean;
  onClose: () => void;
}

const SetHornBid = (props: SetHornBidProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const formContext = useFormContext<HornForm>();
  const squadWatch = useWatch({ control: formContext.control, name: "squad" });
  const wagerAmountWatch = useWatch({
    control: formContext.control,
    name: "wager_amount",
  });
  const timeWatch = useWatch({
    control: formContext.control,
    name: "time",
  });
  const { address } = useAppStore();

  const handleLockHorns = () => {
    setShowSettings(true);
  };

  const handleSubmitSettings = () => {
    setIsConnecting(true);
    setShowSettings(false);
    // Add your connection logic here
  };

  const handleCancel = () => {
    setIsConnecting(false);
    setShowSettings(false);
    props.onClose();
  };

  return (
    <Sheet open={props.isOpen}>
      <SheetContent
        side="bottom"
        className="border-none h-full overflow-scroll p-0 bg-[#1a1a2e]"
      >
        <div className="w-[24.375rem] mx-auto">
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
          />

          {/* Main Lock Horns Button */}
          <div className="p-4">
            <Button
              type="button"
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
              onClick={handleLockHorns}
            >
              Lock horns
            </Button>
          </div>

          {/* Settings Modal - appears when showSettings is true */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end justify-center z-50">
              <div 
                className="flex flex-col items-center p-8 gap-4 w-full max-w-[430px] h-[441px] bg-[#1F1F33] relative"
                style={{
                  boxShadow: "inset 0px 8px 0px rgba(255, 255, 255, 0.16)"
                }}
              >
                <h2 className="text-white text-2xl font-bold mb-6 text-center">
                  LOCK HORNS
                </h2>

                {/* Set Amount */}
                <div className="mb-6 w-full">
                  <FormField
                    control={formContext.control}
                    name="wager_amount"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<HornForm, "wager_amount">;
                    }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel className="text-gray-400 text-left">
                            SET AMOUNT
                          </FormLabel>
                        </div>
                        <div className="flex items-center gap-4 bg-[#2a2a3e] rounded-lg p-3">
                          <button
                            type="button"
                            className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white"
                            onClick={() =>
                              formContext.setValue(
                                "wager_amount",
                                Math.max(0, (wagerAmountWatch || 0) - 0.1)
                              )
                            }
                          >
                            −
                          </button>
                          
                          <div className="flex-1 flex items-center justify-center gap-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                              $
                            </div>
                            <FormControl>
                              <Input
                                className="bg-transparent border-none text-white text-center text-lg font-semibold focus:outline-none p-0"
                                placeholder="0.1"
                                type="number"
                                step="0.1"
                                min="0"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          
                          <button
                            type="button"
                            className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white"
                            onClick={() =>
                              formContext.setValue(
                                "wager_amount",
                                (wagerAmountWatch || 0) + 0.1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Set Time */}
                <div className="mb-6 w-full">
                  <FormField
                    control={formContext.control}
                    name="time"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<HornForm, "time">;
                    }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel className="text-gray-400 text-left">
                            SET TIME
                          </FormLabel>
                        </div>
                        <div className="flex items-center gap-4 bg-[#2a2a3e] rounded-lg p-3">
                          <button
                            type="button"
                            className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white"
                            onClick={() =>
                              formContext.setValue(
                                "time",
                                Math.max(10, (timeWatch || 60) - 10)
                              )
                            }
                          >
                            −
                          </button>
                          
                          <div className="flex-1 flex items-center justify-center">
                            <FormControl>
                              <Input
                                className="bg-transparent border-none text-white text-center text-lg font-semibold focus:outline-none p-0"
                                placeholder="60s"
                                {...field}
                                value={`${field.value || 60}s`}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const value = parseInt(e.target.value.replace('s', '')) || 60;
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                          </div>
                          
                          <button
                            type="button"
                            className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white"
                            onClick={() =>
                              formContext.setValue(
                                "time",
                                (typeof timeWatch === "number" ? timeWatch : 60) + 10
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 h-14 bg-gray-700 hover:bg-gray-600 text-white border-gray-600 font-bold text-lg rounded-lg"
                    onClick={handleCancel}
                  >
                    CANCEL
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-lg"
                    onClick={handleSubmitSettings}
                  >
                    CONFIRM
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Connecting Modal - appears when isConnecting is true */}
          {isConnecting && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end justify-center z-50">
              <div 
                className="flex flex-col items-center p-8 gap-4 w-full max-w-[430px] h-[348.98px] bg-[#1F1F33] relative"
                style={{
                  boxShadow: "inset 0px 8px 0px rgba(255, 255, 255, 0.16)"
                }}
              >
                <div className="flex items-center justify-between mb-8 w-full">
                  <div className="text-center">
                    <DefaultPlayerDp />
                    <span className="text-[0.625rem] block leading-[150%] font-[600] w-[4rem] truncate">
                      {address}
                    </span>
                  </div>
                  <span className="text-[#9898B3] text-[1rem] leading-[150%] font-[400]">
                    Connecting...
                  </span>
                  <div className="text-center">
                    <DefaultDp />
                    <span className="text-[0.625rem] block leading-[150%] font-[600] text-[#9898B3]">
                      waiting...
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full h-14 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-lg"
                  onClick={handleCancel}
                >
                  Cancel request
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SetHornBid;
