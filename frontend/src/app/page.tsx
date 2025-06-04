"use client";

import Header from "@/components/layout/header";
import { useState } from "react";
import { useGetUserSquads } from "./squad/api-services";
import { SquadResponseItem } from "./squad/api-services/types";
import AddNewSquadButton from "./squad/components/add-new-squad-button";
import Pitch from "./squad/components/pitch";
import SquadItem from "./squad/components/squad-item";
import { formationLayouts } from "./squad/constants";
import { FormationLayoutKey } from "./squad/types";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import SetHornBid from "./home/components/set-horn-bid";
import { useDisclosure } from "@/lib/hooks/use-diclosure";

export interface HornForm {
  wager_amount: number;
  squad: SquadResponseItem;
}

export default function Home() {
  const { data: squadData } = useGetUserSquads();
  const [squad, setSquad] = useState<SquadResponseItem>();
  const router = useRouter();
  const form = useForm<HornForm>();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
    router.push("/session");
  });

  return (
    <FormProvider {...form}>
      <form
        id="submit-bid-form"
        className="flex flex-col justify-between"
        onSubmit={onSubmit}
      >
        <Header />
        <Pitch
          layout={
            formationLayouts[squad?.squad.formation as FormationLayoutKey]
          }
          players={squad?.players}
          onPlayerClick={(player) => {
            console.log(player);
          }}
          ctaLabel="Lock horn"
          ctaOnClick={() => {
            onOpen();
          }}
        />
        <div className="bg-[#1E1E28] p-[1.5rem] border-t-[0.4px] border-white mt-1">
          <div className="flex items-center gap-[0.5rem]">
            <div className="flex items-center gap-[0.5rem] w-min overflow-x-scroll">
              {squadData?.data.map((squad) => (
                <SquadItem
                  key={squad.squad.id}
                  onClick={() => {
                    form.setValue("squad", squad);
                    setSquad(squad);
                  }}
                  team={squad}
                />
              ))}
            </div>
            <AddNewSquadButton onClick={() => {}} />
          </div>
        </div>

        <SetHornBid isOpen={isOpen} onClose={onClose} />
      </form>
    </FormProvider>
  );
}
