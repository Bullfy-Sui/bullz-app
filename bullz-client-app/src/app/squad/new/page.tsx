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
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { useCreateSquad } from "../api-services";
import Pitch, { Multiplier, Postition } from "../components/pitch";
import SelectSquadPlayers from "../components/select-squad.players";
import { formationLayouts, SquadFormation } from "../constants";
import { FormationLayoutKey, SquadForm } from "../types";
import SquadNameForm from "../components/squad-name.form";

const NewSquadPage = () => {
  const [layout, setLayout] = useState(formationLayouts.OneThreeOneTwo);
  const [formation, setFormation] = useState(SquadFormation.OneThreeOneTwo);
  const {
    onClose,
    onOpen,
    isOpen,
    disclosedData: selectionDrawerData,
  } = useDisclosure<{ focusedPosition: [Postition, Multiplier] }>();
  const router = useRouter();
  const {
    onClose: closeNotification,
    onOpen: openNotification,
    isOpen: notificationIsOpen,
    disclosedData: noticationModalData,
  } = useDisclosure<NotificationStatus>();
  const {
    mutate: createSquad,
    isPending: creating,
    isSuccess: creationSuccess,
    isError: creationError,
  } = useCreateSquad();
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
    console.log(values);
    createSquad(values, {
      onSuccess: () => {
        closeNameForm();
        openNotification({ data: "success" });
      },
      onError: () => {
        closeNameForm();
        openNotification({ data: "error" });
      },
    });
  });

  const modalContent = useNotificationsModal({
    status: creationSuccess ? "success" : creationError ? "error" : "loading",
    successContent: {
      title: "TEAM CREATED",
      description:
        "NOW, SELECT YOUR TEAM AND LOCK HORNS TO FIND SOMEONE TO PLAY WITH.",
      buttonLabel: "SHOW MY TEAM",
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
            isLoading={creating}
            isOpen={nameFormIsOpen}
            onClose={closeNameForm}
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
        status={noticationModalData}
        // @ts-expect-error - -
        title={modalContent?.title}
        description={modalContent?.description}
      />
    </>
  );
};

export default NewSquadPage;
