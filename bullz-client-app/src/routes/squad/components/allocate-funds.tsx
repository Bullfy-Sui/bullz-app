"use client";

import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import AllocationItem from "./allocation-item";
import { Key } from "react";

interface AllocateFundsProps {
  isOpen: boolean;
  onCloseAction: () => void;
  totalBudget: number;
}

export default function AllocateFunds({
  isOpen,
  onCloseAction,
  totalBudget,
}: AllocateFundsProps) {
  const formContext = useFormContext();
  const playerArray = useFieldArray({
    control: formContext.control,
    name: "players",
  });

  const playerArrayWatch = useWatch({
    control: formContext.control,
    name: "players",
  });

  const total_squad_value = playerArrayWatch?.reduce(
    (a: number, b: { allocated_value: number }) => a + b.allocated_value,
    0
  );

  return (
    <Sheet open={isOpen}>
      <SheetContent side="bottom" className="border-none h-screen bg-slate-900">
        <div className="w-full max-w-md mx-auto px-4 overflow-y-scroll">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseAction}
              className="text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK
            </Button>
            <h2 className="text-lg font-semibold">ALLOCATION OF FUNDS</h2>
            <div className="w-8" />
          </div>

          {/* Budget Info */}
          <div className="bg-slate-800 rounded-lg w-full flex items-center justify-between h-16 px-3 py-3 mt-4">
            <div>
              <span className="text-xs text-green-400 block">Budget</span>
              <span className="text-xs text-white block">
                ${(totalBudget - total_squad_value).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-red-400 block">Allocation</span>
              <span className="text-xs text-white block">
                {((total_squad_value / totalBudget) * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Allocation Items */}
          <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto">
            {playerArrayWatch?.map(
              (
                player: {
                  position: Key | null | undefined;
                  allocated_value: number;
                  name: string;
                },
                index: number
              ) => (
                <AllocationItem
                  key={player.position}
                  value={player.allocated_value}
                  name={player.name}
                  onSlide={(value) => {
                    playerArray.update(index, {
                      ...playerArrayWatch[index],
                      allocated_value: value,
                    });
                  }}
                />
              )
            )}
          </div>

          {/* Team Name Input */}
          <div className="bg-slate-900 pt-6 mt-4">
            <FormField
              control={formContext.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Enter Your Team Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="border-none bg-slate-800 text-white"
                      placeholder="FIGHTERS"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              form="create-squad-form"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 mt-6"
            >
              CREATE TEAM
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
