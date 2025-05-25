"use client";

import { TokenResponse } from "@/common-api-services/token-price.ts/types";
import NotificationModal from "@/components/general/modals/notify";
import TitleBar from "@/components/general/title-bar";
import PriceList from "@/components/general/token/price-list";
import EmptyPitch from "@/components/svg/pitch/empty-pitch";
import SuiLogo from "@/components/svg/sui.logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useNotificationsModal } from "@/lib/hooks/use-notifications-modal";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useCreateSquad } from "../api-services";
import AllocateFunds from "../components/allocate-funds";
import { formationLayouts, SquadFormation, TOTAL_BUDGET } from "../constants";
import { FormationLayoutKey, IPlayer, SquadForm } from "../types";

const Player = ({
  player,
  onClick,
}: {
  player: IPlayer;
  onClick: () => void;
}) => {
  return (
    <div className="w-[4.375rem] h-[4.375rem]" onClick={onClick}>
      <div className="bg-sui-blue w-full h-full flex items-center justify-center">
        {/* <SolanaLogo /> */}
        <SuiLogo className="size-[2.75rem]" />
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
  const {
    onClose: closeNotification,
    onOpen: openNotification,
    isOpen: notificationIsOpen,
  } = useDisclosure();
  const {
    mutate: createSquad,
    isPending: creating,
    isSuccess: creationSuccess,
    isError: creationError,
  } = useCreateSquad();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null); // Add this state for focused index
  const {
    isOpen: allocationDrawerIsOpen,
    onClose: closeAllocationDrawer,
    onOpen: openAllocationDrawer,
  } = useDisclosure();
  const form = useForm<SquadForm>({
    defaultValues: { formation: "OneThreeOneTwo" },
  });
  const playerArray = useFieldArray({ control: form.control, name: "players" });

  const handlePlayerSelect = (token: TokenResponse) => {
    if (playerArray.fields.length < 7) {
      playerArray.append({
        position: focusedIndex as number,
        name: token.token_symbol,
        allocated_value: (1 / 100) * TOTAL_BUDGET,
        token_price_id: token.token_id,
      });
      console.log(playerArray.fields);
    }
    onClose();
  };

  const onSubmit = form.handleSubmit((values) => {
    console.log(values);
    openNotification();
    createSquad(values);
  });

  const modalContent = useNotificationsModal({
    isSuccess: creationSuccess,
    isError: creationError,
    isLoading: creating,
    successContent: {
      title: "Bullish !!!",
      description: "You just created a team.",
      buttonLabel: "Go Back Home",
      type: "success",
      onButtonClick: closeNotification,
    },
    errorContent: {
      title: "Error",
      description: "Sorry, we couldn’t create your team.",
      buttonLabel: "Try Again",
      type: "error",
      onButtonClick: () => createSquad(form.getValues()),
    },
    loadingContent: { description: "Creating your squad", type: "loading" },
  });

  return (
    <>
      <FormProvider {...form}>
        <form id="create-squad-form" onSubmit={onSubmit}>
          <TitleBar title="Create a team" onClick={onClose} />
          <div>
            <div className="bg-[#121219] flex gap-[0.625rem] items-center justify-center mb-[1.625rem] mt-[1rem] h-[1.5rem]">
              {Object.values(SquadFormation).map((value) => (
                <span
                  className={cn(
                    "w-[4.25rem] text-white h-full text-center rounded-full text-[0.75rem] leading-[120%] font-bold flex items-center justify-center cursor-pointer",
                    {
                      "bg-button-bg ": formation === value,
                    }
                  )}
                  key={value}
                  onClick={() => {
                    const formation = Object.keys(SquadFormation).find(
                      (k) => SquadFormation[k as FormationLayoutKey] === value
                    );
                    // console.log(formation);
                    form.setValue("formation", formation as FormationLayoutKey);
                    setFormation(value as SquadFormation);
                    setLayout(
                      formationLayouts[formation as FormationLayoutKey]
                    );
                  }}
                >
                  {value}
                </span>
              ))}
            </div>
            <main className="relative flex flex-col items-center">
              <div className="absolute h-[33.5625rem] w-[23.375rem] flex flex-col justify-between pt-[4rem] mx-auto">
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
                {/* )} */}
              </div>

              <EmptyPitch />
              <div className="px-[1.5rem] w-full">
                <Button
                  type="button"
                  onClick={() => openAllocationDrawer()}
                  className=" w-full  z-10 cursor-pointer hover:bg-button-bg"
                >
                  Proceed
                </Button>
              </div>
            </main>
          </div>

          <Sheet open={isOpen}>
            <SheetContent side="bottom" className="border-none h-screen">
              <div className="w-[24.375rem] mx-auto px-[1.25rem] overflow-y-scroll">
                <PriceList
                  onClickBack={onClose}
                  onSelect={(token) => handlePlayerSelect(token)}
                />
              </div>
            </SheetContent>
          </Sheet>

          <AllocateFunds
            isOpen={allocationDrawerIsOpen}
            onClose={closeAllocationDrawer}
          />
        </form>
      </FormProvider>

      <NotificationModal
        isOpen={notificationIsOpen}
        onClose={closeNotification}
        // @ts-expect-error - -
        onButtonClick={modalContent?.onButtonClick}
        // @ts-expect-error - -
        buttonLabel={modalContent?.buttonLabel}
        // @ts-expect-error - -
        type={modalContent?.type}
        isLoading={creating}
        // @ts-expect-error - -
        title={modalContent?.title}
        // @ts-expect-error - -
        description={modalContent?.description}
      />
    </>
  );
};

export default NewSquadPage;
