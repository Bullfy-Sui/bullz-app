"use client";

import NotificationModal from "@/components/general/modals/notify";
import TitleBar from "@/components/general/title-bar";
import InfoBulbIcon from "@/components/icons/info-bulb.icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useNotificationsModal } from "@/lib/hooks/use-notifications-modal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useCreateSquad } from "../api-services";
import AllocateFunds from "../components/allocate-funds";
import Pitch from "../components/pitch";
import SelectSquadPlayers from "../components/select-squad.players";
import { formationLayouts, SquadFormation } from "../constants";
import { FormationLayoutKey, SquadForm } from "../types";

const NewSquadPage = () => {
  const [layout, setLayout] = useState(formationLayouts.OneThreeOneTwo);
  const [formation, setFormation] = useState(SquadFormation.OneThreeOneTwo);
  const { onClose, onOpen, isOpen } = useDisclosure();
  const router = useRouter();
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
  const { isOpen: allocationDrawerIsOpen, onOpen: openAllocationDrawer } =
    useDisclosure();
  const form = useForm<SquadForm>({
    defaultValues: { formation: "OneThreeOneTwo" },
  });
  const playerArray = useFieldArray({ control: form.control, name: "players" });
  // const playerArrayWatch = useWatch({ control: form.control, name: "players" });

  console.log(focusedIndex);
  // const handlePlayerSelect = (token: TokenResponse) => {
  //   const foundPlayer = playerArrayWatch?.find(
  //     (player) => player.position === focusedIndex
  //   );
  //   console.log(
  //     foundPlayer,
  //     focusedIndex,
  //     token,
  //     playerArray.fields,
  //     playerArray.fields.length
  //   );

  //   if (foundPlayer)
  //     playerArray.update(playerArrayWatch.indexOf(foundPlayer), {
  //       ...foundPlayer,
  //       name: token.token_symbol,
  //       token_price_id: token.token_id,
  //     });

  //   if (playerArray.fields.length < 7 && !foundPlayer) {
  //     playerArray.append({
  //       position: focusedIndex as number,
  //       name: token.token_symbol,
  //       allocated_value: (1 / 100) * TOTAL_BUDGET,
  //       token_price_id: token.token_id,
  //     });
  //     console.log(playerArray.fields);
  //   }
  //   onClose();
  // };

  const onSubmit = form.handleSubmit((values) => {
    console.log(values);
    openNotification();
    createSquad(values);
  });

  const modalContent = useNotificationsModal({
    status: creationSuccess ? "success" : creationError ? "error" : "loading",
    successContent: {
      title: "Bullish !!!",
      description: "You just created a team.",
      buttonLabel: "Go Back Home",
      onButtonClick: () => {
        router.push("/");
        closeNotification();
      },
    },
    errorContent: {
      title: "Error",
      description: "Sorry, we couldn’t create your team.",
      buttonLabel: "Try Again",
      onButtonClick: () => createSquad(form.getValues()),
    },
    loadingContent: { description: "Creating your squad", type: "loading" },
  });

  return (
    <>
      <FormProvider {...form}>
        <form id="create-squad-form" onSubmit={onSubmit}>
          <TitleBar title="Create a team" onClick={onClose} />
          <div className=" flex flex-col justify-between h-full">
            <div className=" border border-gray-800 bg-background flex gap-[0.625rem] items-center justify-between mb-[1.625rem] mt-[1rem] h-[2.5rem]">
              {Object.values(SquadFormation).map((value) => (
                <span
                  className={cn(
                    "w-[4.25rem] text-white h-full text-center  text-[0.875rem] leading-[100%] tracking-[0.04em] font-bold font-offbit flex items-center justify-center cursor-pointer",
                    {
                      "bg-gray-800 ": formation === value,
                    }
                  )}
                  style={{
                    boxShadow:
                      formation === value
                        ? "0px -4px 0px 0px #0000003D inset, 0px 4px 0px 0px #FFFFFF29 inset"
                        : "",
                  }}
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
            <div className="flex flex-col items-center justify-center w-[17.5rem] mx-auto gap-[1rem] mb-[1.5rem]">
              <InfoBulbIcon />
              <p className="font-offbit w-[17.5rem] font-[700] tracking-[0.04em] leading-[100%] text-center text-[1.0625rem] text-gray-300 uppercase">
                Choose a formation above, then tap a position below to add or
                change a token. When all positions are set, click Continue.
              </p>
              <Button variant="secondary" className="w-full">
                Continue
              </Button>
            </div>
            <Pitch
              layout={layout}
              players={playerArray.fields}
              onPlayerClick={(player) => {
                setFocusedIndex(player.position);
                onOpen();
              }}
              onEmptyPlayerClick={(pos) => {
                setFocusedIndex(pos);
                onOpen();
              }}
              ctaLabel="Proceed"
              ctaOnClick={() => openAllocationDrawer()}
            />
          </div>

          <Sheet open={isOpen}>
            <SheetContent side="bottom" className="border-none h-screen">
              <div className="w-[24.375rem] mx-auto px-[1.25rem] overflow-y-scroll">
                {/* <PriceList
                  onClickBack={onClose}
                  onSelect={(token) => handlePlayerSelect(token)}
                /> */}
                <SelectSquadPlayers onClose={onClose} list={layout.flat()} />
              </div>
            </SheetContent>
          </Sheet>

          <AllocateFunds
            isOpen={allocationDrawerIsOpen}
            onCloseAction={function (): void {
              throw new Error("Function not implemented.");
            }}
            totalBudget={0}
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
        description={modalContent?.description}
      />
    </>
  );
};

export default NewSquadPage;
