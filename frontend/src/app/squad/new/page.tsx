"use client";

import TitleBar from "@/components/general/title-bar";
import PriceList from "@/components/general/token/price-list";
import EmptyPitch from "@/components/svg/pitch/empty-pitch";
import SolanaLogo from "@/components/svg/sol.logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AllocateFunds from "../components/allocate-funds";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { TOTAL_BUDGET } from "../constants";

interface Player {
  allocated_value: number;
  name: string;
  position: number;
  // token_price_id: string;
}
type FormationLayoutKey = keyof typeof formationLayouts;
interface SquadForm {
  name: string;
  formation: FormationLayoutKey;
  players: Player[];
  // wallet_address: string
}

enum SquadFormation {
  OneThreeTwoOne = "1-3-2-1",
  OneTwoThreeOne = "1-2-3-1",
  OneTwoTwoTwo = "1-2-2-2",
  OneThreeOneTwo = "1-3-1-2",
  OneTwoOneThree = "1-2-1-3",
}

const formationLayouts = {
  OneThreeTwoOne: [
    [1], // GK
    [2, 3, 4], // Def
    [5, 6], // Mid
    [7], // Fwd
  ],
  OneTwoThreeOne: [
    [1], // GK
    [2, 3], // Def
    [4, 5, 6], // Defense
    [7], // Fwd
  ],
  OneTwoTwoTwo: [
    [1], // GK
    [2, 3], // Def
    [4, 5], // Mid
    [6, 7], // Fwd
  ],
  OneThreeOneTwo: [
    [1], // GK
    [2, 3, 4], // Def
    [5], // Mid
    [6, 7], // Fwd
  ],
  OneTwoOneThree: [
    [1], // GK
    [2, 3], // Def
    [4], // Mid
    [5, 6, 7], // Fwd
  ],
};

const Player = ({
  player,
  onClick,
}: {
  player: Player;
  onClick: () => void;
}) => {
  return (
    <div className="w-[4.375rem] h-[4.375rem]" onClick={onClick}>
      <div className="bg-background w-full h-full flex items-center justify-center">
        <SolanaLogo />
      </div>
      <div className="w-full bg-white flex items-center justify-center">
        <span className=" text-black w-full text-sm text-center">
          {player.name}
        </span>
      </div>
    </div>
  );
};

const NewSquadPage = () => {
  const [layout, setLayout] = useState(formationLayouts.OneThreeOneTwo);
  const [formation, setFormation] = useState(SquadFormation.OneThreeOneTwo);
  const { onClose, onOpen, isOpen } = useDisclosure();

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null); // Add this state for focused index
  const {
    isOpen: allocationDrawerIsOpen,
    onClose: closeAllocationDrawer,
    onOpen: openAllocationDrawer,
  } = useDisclosure();
  const form = useForm<SquadForm>();
  const playerArray = useFieldArray({ control: form.control, name: "players" });

  const handlePlayerSelect = () => {
    if (playerArray.fields.length < 7) {
      playerArray.append({
        position: focusedIndex as number,
        name: "Solana",
        allocated_value: (1 / 100) * TOTAL_BUDGET,
      });
      onClose();
    }
  };

  return (
    <FormProvider {...form}>
      <div>
        <div className="bg-[#121219] flex gap-[0.625rem] items-center justify-center mb-[1.625rem] mt-[1rem] h-[1.5rem]">
          {Object.values(SquadFormation).map((value) => (
            <span
              className={cn(
                "w-[4.25rem] h-full text-center rounded-full text-[0.75rem] leading-[120%] font-bold flex items-center justify-center cursor-pointer",
                {
                  "bg-button-bg text-black": formation === value,
                  " text-white": formation !== value,
                }
              )}
              key={value}
              onClick={() => {
                const formation = Object.keys(SquadFormation).find(
                  (k) => SquadFormation[k as FormationLayoutKey] === value
                );
                setFormation(value as SquadFormation);
                setLayout(formationLayouts[formation as FormationLayoutKey]);
              }}
            >
              {value}
            </span>
          ))}
        </div>
        <main className="relative flex justify-center">
          <div className="absolute  h-[36.5625rem] w-[23.375rem] flex flex-col justify-between py-[4rem] mx-auto">
            {layout.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex justify-center gap-[3.125rem]"
              >
                {row.map((pos) => {
                  const player = playerArray.fields.find(
                    (p) => p.position === pos
                  );
                  return player ? (
                    <Player
                      key={player.position}
                      player={player}
                      onClick={() => {
                        setFocusedIndex(pos);
                        onOpen();
                      }}
                    />
                  ) : (
                    <div
                      key={pos}
                      className="w-[4.375rem] h-[4.375rem] bg-[#E9E4E4] cursor-pointer"
                      onClick={() => {
                        setFocusedIndex(pos);
                        onOpen();
                      }}
                    />
                  );
                })}
              </div>
            ))}
            {/* {players.length === 7 && ( */}
            <Button
              onClick={() => openAllocationDrawer()}
              className=" w-full -mb-[5rem] z-10 cursor-pointer hover:bg-button-bg"
            >
              Proceed
            </Button>
            {/* )} */}
          </div>
          <EmptyPitch />
        </main>
      </div>

      <Sheet open={isOpen}>
        <SheetContent side="bottom" className="border-none h-screen">
          <div className="w-[24.375rem] mx-auto px-[1.25rem] overflow-y-scroll">
            <TitleBar title="Create a team" onClick={onClose} />
            <PriceList onSelect={handlePlayerSelect} />
          </div>
        </SheetContent>
      </Sheet>

      <AllocateFunds
        isOpen={allocationDrawerIsOpen}
        onClose={closeAllocationDrawer}
      />
    </FormProvider>
  );
};

export default NewSquadPage;
