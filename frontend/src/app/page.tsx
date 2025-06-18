"use client";

import NavWrapper from "@/components/layout/nav-wrapper";
import { Button } from "@/components/ui/button";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import SetHornBid from "./home/components/set-horn-bid";
import { useGetUserSquads } from "./squad/api-services";
import { SquadResponseItem } from "./squad/api-services/types";
import AddNewSquadButton from "./squad/components/add-new-squad-button";
import Pitch from "./squad/components/pitch";
import SquadItem from "./squad/components/squad-item";
import { formationLayouts } from "./squad/constants";
import { FormationLayoutKey } from "./squad/types";

export interface HornForm {
  wager_amount: number;
  time_limit: number;
  squad: SquadResponseItem;
}

export default function Home() {
  const { data: squadData } = useGetUserSquads();
  // const [squad, setSquad] = useState<SquadResponseItem>();
  const router = useRouter();
  const form = useForm<HornForm>({
    defaultValues: {},
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const squadWatch = useWatch({
    control: form.control,
    name: "squad",
    defaultValue: squadData?.data[0],
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
    // router.push("/session");
  });

  return (
    <NavWrapper>
      <FormProvider {...form}>
        <form
          id="submit-bid-form"
          className="flex flex-col justify-between mt-[4rem]"
          onSubmit={onSubmit}
        >
          <div className="flex max-w-[23.875rem] mx-auto items-center justify-between h-[3.5rem] w-full mb-[0.5625rem] bg-gray-850 p-[0.5rem] border border-gray-700">
            <div>
              <p className="font-offbit text-[1.375rem] font-[700] leading-[100%] mb-[0.25rem] capitalize">
                {squadWatch?.squad.name}
              </p>
              <span className="block text-gray-400 text-[0.875rem] font-[700] leading-[100%] tracking-[0.04em]">
                10% WIN RATE
              </span>
            </div>
            <Button
              type="button"
              className="h-[2.5rem] px-[1.5rem]"
              onClick={() => onOpen()}
            >
              PLAY NOW
            </Button>
          </div>

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
            ctaLabel="Lock horns"
          />

          <div
            style={{
              boxShadow: "0px 4px 0px 0px #FFFFFF29 inset",
            }}
            className="bg-gray-850  w-full px-[1.5rem] py-[1rem] "
          >
            <span className="text-gray-300 font-[700] font-offbit block text-[0.875rem] leading-[100%] mb-[0.5rem] ">
              YOUR BULLZ
            </span>
            <div className="flex items-center gap-[0.5rem] ">
              <div className="flex items-center gap-[0.5rem] w-min overflow-x-scroll ">
                {squadData?.data.map((squad) => (
                  <SquadItem
                    key={squad.squad.id}
                    onClick={() => {
                      form.setValue("squad", squad);
                    }}
                    team={squad}
                    selected={squadWatch?.squad.id === squad.squad.id}
                  />
                ))}
              </div>
              <AddNewSquadButton
                onClick={() => {}}
                classNames="h-[6rem] w-[6rem]"
              />
            </div>
          </div>

          <SetHornBid isOpen={isOpen} onClose={onClose} />
        </form>
      </FormProvider>
    </NavWrapper>
  );
}
