"use client";

import NotificationModal from "@/components/general/modals/notify";
import TitleBar from "@/components/general/title-bar";
import InfoBulbIcon from "@/components/icons/info-bulb.icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import {
  NotificationStatus,
  useNotificationsModal,
} from "@/lib/hooks/use-notifications-modal";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { useFullSquadCreation, useSquadCreationStatus } from "@/lib/hooks/use-full-squad-creation";
import Pitch, { Multiplier, Postition } from "../components/pitch";
import SelectSquadPlayers from "../components/select-squad.players";
import { formationLayouts, SquadFormation } from "../constants";
import { FormationLayoutKey, SquadForm } from "../types";
import SquadNameForm from "../components/squad-name.form";
import { useNavigate } from "react-router";

const NewSquadPage = () => {
  const [layout, setLayout] = useState(formationLayouts.OneThreeOneTwo);
  const [formation, setFormation] = useState(SquadFormation.OneThreeOneTwo);
  const {
    onClose,
    onOpen,
    isOpen,
    disclosedData: selectionDrawerData,
  } = useDisclosure<{ focusedPosition: [Postition, Multiplier] }>();
  const navigate = useNavigate();
  const {
    onClose: closeNotification,
    onOpen: openNotification,
    isOpen: notificationIsOpen,
    disclosedData: noticationModalData,
  } = useDisclosure<NotificationStatus>();
  
  // Smart contract hooks
  const fullSquadCreation = useFullSquadCreation();
  const creationStatus = useSquadCreationStatus();
  
  const {
    isOpen: nameFormIsOpen,
    onClose: closeNameForm,
    onOpen: openNameForm,
  } = useDisclosure();

  const form = useForm<SquadForm>({
    defaultValues: { formation: "OneThreeOneTwo" },
  });
  const playerArray = useFieldArray({ control: form.control, name: "players" });
  const playerArrayWatch = useWatch({ control: form.control, name: "players" });

  console.log(playerArray.fields, playerArrayWatch);

  const onSubmit = form.handleSubmit((values) => {
    console.log("Creating squad with values:", values);
    fullSquadCreation.mutate(
      { squadForm: values },
      {
        onSuccess: (result) => {
          console.log("Squad created successfully:", result);
          closeNameForm();
          openNotification({ data: "success" });
        },
        onError: (error) => {
          console.error("Squad creation failed:", error);
          closeNameForm();
          openNotification({ data: "error" });
        },
      }
    );
  });

  const modalContent = useNotificationsModal({
    status: creationStatus.isAllSuccess ? "success" : creationStatus.hasAnyError ? "error" : "loading",
    successContent: {
      title: "TEAM CREATED",
      description:
        "YOUR BULL HAS BEEN CREATED ON THE BLOCKCHAIN. YOU CAN NOW LOCK HORNS WITH OTHER PLAYERS.",
      buttonLabel: "SHOW MY TEAM",
      onButtonClick: () => {
        navigate("/squad");
        closeNotification();
      },
    },
    errorContent: {
      title: "CREATION FAILED",
      description: "SORRY, WE COULDN'T CREATE YOUR TEAM ON THE BLOCKCHAIN. PLEASE TRY AGAIN.",
      buttonLabel: "Try Again",
      onButtonClick: () => {
        closeNotification();
      },
    },
    loadingContent: {
      title: "CREATING TEAM",
      description: creationStatus.isAnyLoading 
        ? "CREATING YOUR BULL ON THE BLOCKCHAIN..." 
        : "PROCESSING...",
      buttonLabel: "",
      onButtonClick: () => {},
    },
  });

  return (
    <>
      <FormProvider {...form}>
        <form id="create-squad-form" onSubmit={onSubmit}>
          <TitleBar title="Create a team" onClick={() => navigate("/squad")} />
          <div className=" flex flex-col justify-between h-full">
            <div className=" border border-gray-800 bg-background flex gap-[0.625rem] items-center justify-between mb-[1.625rem] mt-[1rem] h-[2.5rem]">
              {Object.values(SquadFormation).map((value) => (
                <span
                  className={cn(
                    "w-[4.25rem] text-white h-full text-center  text-[0.875rem] leading-[100%] tracking-[0.04em] font-bold font-offbit flex items-center justify-center cursor-pointer",
                    {
                      "bg-gray-800 ": formation === value,
                    },
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
                      (k) => SquadFormation[k as FormationLayoutKey] === value,
                    );
                    // console.log(formation);
                    form.setValue("formation", formation as FormationLayoutKey);
                    setFormation(value as SquadFormation);
                    setLayout(
                      formationLayouts[formation as FormationLayoutKey],
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
              <Button
                type="button"
                onClick={() => openNameForm()}
                variant={
                  playerArrayWatch?.length == 7 ? "default" : "secondary"
                }
                className="w-full"
                disabled={!playerArrayWatch || playerArrayWatch?.length < 7}
              >
                Continue
              </Button>
            </div>
            <Pitch
              layout={layout}
              players={playerArrayWatch}
              onPlayerClick={(player) => {
                onOpen({
                  data: {
                    focusedPosition: [player.position, player.multiplier],
                  },
                });
              }}
              onEmptyPlayerClick={(pos) => {
                onOpen({ data: { focusedPosition: pos } });
              }}
              ctaLabel="Proceed"
            />
          </div>

          <Sheet open={isOpen}>
            <SheetContent side="bottom" className="border-none h-screen">
              <div className="w-[24.375rem] mx-auto px-[1.25rem] overflow-y-scroll">
                <SelectSquadPlayers
                  initialFocusedPosition={selectionDrawerData?.focusedPosition}
                  onClose={onClose}
                  list={layout.flat()}
                />
              </div>
            </SheetContent>
          </Sheet>
          <SquadNameForm
            isLoading={creationStatus.isAnyLoading}
            isOpen={nameFormIsOpen}
            onClose={closeNameForm}
          />
        </form>
      </FormProvider>

      <NotificationModal
        isOpen={notificationIsOpen}
        onClose={closeNotification}
        onButtonClick={modalContent?.onButtonClick}
        buttonLabel={modalContent?.buttonLabel}
        // @ts-expect-error - -
        status={noticationModalData}
        title={modalContent?.title}
        description={modalContent?.description}
      />
    </>
  );
};

export default NewSquadPage;
