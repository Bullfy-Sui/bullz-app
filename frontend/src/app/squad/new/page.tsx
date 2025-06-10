"use client";

import { TokenResponse } from "@/common-api-services/token-price.ts/types";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import Pitch from "../components/pitch";
import { formationLayouts, SquadFormation, TOTAL_BUDGET } from "../constants";
import { FormationLayoutKey, SquadForm } from "../types";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import PriceList from "@/components/general/token/price-list";
import { Button } from "@/components/ui/button";
import { useCreateSquad } from "../api-services";
import NotificationModal from "@/components/general/modals/notify";
import { useDisclosure } from "@/lib/hooks/use-diclosure";

export default function NewSquadPage() {
  const router = useRouter();
  const [layout, setLayout] = useState(formationLayouts.ThreeTwoOne);
  const [formation, setFormation] = useState(SquadFormation.ThreeTwoOne);
  const [isPlayerSelectOpen, setIsPlayerSelectOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    isOpen: isNotificationOpen,
    onOpen: openNotification,
    onClose: closeNotification,
  } = useDisclosure();

  const { mutate: createSquad, isPending: isCreating } = useCreateSquad();

  const form = useForm<SquadForm>({
    defaultValues: {
      formation: "ThreeTwoOne",
      players: [],
    },
  });

  const playerArray = useFieldArray({
    control: form.control,
    name: "players",
  });

  const playerArrayWatch = useWatch({
    control: form.control,
    name: "players",
  });

  const allPositions = layout.flat();
  const isTeamComplete = allPositions.every((pos) =>
    playerArrayWatch?.some((player) => player.position === pos)
  );

  const handleFormationChange = (selectedFormation: SquadFormation) => {
    const formationKey = Object.keys(SquadFormation).find(
      (k) => SquadFormation[k as keyof typeof SquadFormation] === selectedFormation
    ) as FormationLayoutKey;

    form.setValue("formation", formationKey);
    setFormation(selectedFormation);
    setLayout(formationLayouts[formationKey]);
  };

  const handlePlayerSelect = (token: TokenResponse) => {
    if (focusedIndex === null) return;

    const existingIndex = playerArrayWatch.findIndex(
      (player) => player.position === focusedIndex
    );

    const newPlayer = {
      position: focusedIndex,
      name: token.token_symbol,
      allocated_value: (1 / 7) * TOTAL_BUDGET,
      token_price_id: token.token_id,
    };

    if (existingIndex !== -1) {
      playerArray.update(existingIndex, newPlayer);
    } else {
      playerArray.append(newPlayer);
    }

    setIsPlayerSelectOpen(false);
    setFocusedIndex(null);
  };

  const handlePlayerClick = (position: number) => {
    setFocusedIndex(position);
    setIsPlayerSelectOpen(true);
  };

  const onSubmit = form.handleSubmit(() => {
    openNotification();
  });

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;

    // Make the API call to create the squad
    createSquad(
      { ...form.getValues(), name: teamName },
      {
        onSuccess: () => {
          // Close the team name modal and show success modal
          closeNotification();
          setShowSuccessModal(true);
        },
        onError: (error) => {
          // Handle error case - you might want to show an error modal or toast
          console.error('Failed to create squad:', error);
          // Keep the team name modal open on error so user can try again
        },
      }
    );
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setTeamName("");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-4 p-4 border-b border-gray-700">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">CREATE A TEAM</h1>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="p-4">
          <div className="mb-6">
            <FormField
              control={form.control}
              name="formation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-0 items-center justify-center mb-4">
                      {Object.values(SquadFormation).map((value, index) => (
                        <button
                          key={value}
                          type="button"
                          className={cn(
                            "px-4 py-2 text-sm font-bold transition-colors border-r border-gray-600 last:border-r-0",
                            formation === value
                              ? "bg-orange-500 text-white"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700",
                            index === 0 && "rounded-l-md",
                            index === Object.values(SquadFormation).length - 1 && "rounded-r-md"
                          )}
                          onClick={() => {
                            handleFormationChange(value);
                            field.onChange(
                              Object.keys(SquadFormation).find(
                                (k) => SquadFormation[k as keyof typeof SquadFormation] === value
                              )
                            );
                          }}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-sm">💡</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                CHOOSE A FORMATION ABOVE, THEN TAP A POSITION BELOW TO SELECT A TOKEN. WHEN ALL
                POSITIONS ARE SET, CLICK CONTINUE.
              </p>

              <div className="mt-6 flex justify-center">
                <Button
                  variant={!isTeamComplete ? "secondary" : "default"}
                  size="lg"
                  type="submit"
                  className="w-full max-w-xs"
                  disabled={!isTeamComplete}
                >
                  CONTINUE
                </Button>
              </div>
            </div>

            <Pitch
              layout={layout}
              players={playerArray.fields}
              onPlayerClick={(player) => handlePlayerClick(player.position)}
              onEmptyPlayerClick={handlePlayerClick}
            />
          </div>
        </form>
      </Form>

      <Sheet open={isPlayerSelectOpen} onOpenChange={setIsPlayerSelectOpen}>
        <SheetContent side="bottom" className="border-none h-screen bg-gray-900">
          <SheetTitle className="sr-only">Select a Player</SheetTitle>
          <PriceList
            onClickBack={() => setIsPlayerSelectOpen(false)}
            onSelect={handlePlayerSelect}
          />
        </SheetContent>
      </Sheet>

      {/* Team Name Input Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={closeNotification}
        type="custom"
        title="Name Your Team"
        description={
          <div className="mt-4">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full p-2 border border-gray-300 rounded text-black"
            />
          </div>
        }
        buttonLabel="Create Team"
        onButtonClick={handleCreateTeam}
        secondaryButtonLabel="Cancel"
        onSecondaryButtonClick={closeNotification}
        isLoading={isCreating}
      />

      {/* Success Modal */}
      <NotificationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        type="success"
        title="TEAM CREATED!"
        description="NOW SELECT YOUR TEAM AND LOCK HORNS TO FIND SOMEONE TO PLAY WITH."
        buttonLabel="SHOW MY TEAM"
        secondaryButtonLabel="BACK HOME"
        onButtonClick={() => {
          handleSuccessModalClose();
          router.push("/my-teams");
        }}
        onSecondaryButtonClick={() => {
          handleSuccessModalClose();
          router.push("/");
        }}
        isLoading={false}
      />
    </div>
  );
}
