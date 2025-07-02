import NavWrapper from "@/components/layout/nav-wrapper";
import { Button } from "@/components/ui/button";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import SetHornBid from "./components/set-horn-bid";
import { useGetUserSquads, useGetUserBids } from "@/lib/hooks/use-squad-contract";
import { SquadResponseItem } from "../squad/api-services/types";
import AddNewSquadButton from "../squad/components/add-new-squad-button";
import Pitch from "../squad/components/pitch";
import SquadItem from "../squad/components/squad-item";
import { formationLayouts } from "../squad/constants";
import { FormationLayoutKey } from "../squad/types";
import { useNavigate } from "react-router";
import { useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface HornForm {
  wager_amount: number;
  time_limit: number;
  squad: SquadResponseItem;
}

export default function Home() {
  const { data: userSquads, isLoading } = useGetUserSquads();
  const { data: userBids, isLoading: isLoadingBids } = useGetUserBids();
  const navigate = useNavigate();

  // Convert SquadData[] to SquadResponse format for compatibility
  const squadData = useMemo(() => {
    console.log("🔄 Converting userSquads:", userSquads);
    
    if (!userSquads || userSquads.length === 0) {
      console.log("❌ No user squads found");
      return { data: [] };
    }

    const convertedSquads: SquadResponseItem[] = userSquads.map(squad => {
      const formation = "OneThreeTwoOne" as FormationLayoutKey;
      const layout = formationLayouts[formation];
      
      // Flatten the layout to get all positions with their multipliers
      const allPositions: [number, number][] = layout.flat().map(posArray => [posArray[0], posArray[1]] as [number, number]);
      
      // Map players to positions with correct multipliers
      const players = squad.players.slice(0, 7).map((playerName, index) => {
        const [position, multiplier] = allPositions[index] || [index + 1, 1.0];
        return {
          id: `${squad.squad_id}-${position}`,
          name: playerName,
          position: position,
          squad_id: squad.squad_id.toString(),
          token_price_id: playerName,
          multiplier: multiplier,
        };
      });

      console.log(`🏟️ Squad "${squad.name}" players:`, players);

      return {
        squad: {
          id: squad.squad_id.toString(),
          name: squad.name,
          owner_id: squad.owner,
          wallet_address: squad.owner,
          formation: formation,
          total_value: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        players: players
      };
    });

    console.log("✅ Converted squads:", convertedSquads);
    return { data: convertedSquads };
  }, [userSquads]);

  const form = useForm<HornForm>({
    defaultValues: {
      squad: {
        squad: {
          id: "",
          name: "",
          owner_id: "",
          wallet_address: "",
          formation: "OneThreeTwoOne",
          total_value: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        players: [],
      },
      wager_amount: 1,
      time_limit: 60, // 1 minute in seconds
    },
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  const squadWatch = useWatch({
    control: form.control,
    name: "squad",
  });

  // Debug squadWatch changes
  useEffect(() => {
    console.log("👀 squadWatch changed:", squadWatch);
    if (squadWatch?.players) {
      console.log("🏃‍♂️ Squad players:", squadWatch.players);
    }
  }, [squadWatch]);

  // Set the first squad when squads are loaded
  useEffect(() => {
    if (squadData?.data[0] && !squadWatch) {
      console.log("🎯 Setting first squad:", squadData.data[0].squad.name);
      form.setValue("squad", squadData.data[0]);
    }
  }, [squadData?.data, squadWatch, form]);

  // Initialize form when userSquads data becomes available
  useEffect(() => {
    if (userSquads && userSquads.length > 0 && !squadWatch.squad.id) {
      const firstSquad = userSquads[0];
      form.setValue("squad", {
        squad: {
          id: firstSquad.squad_id.toString(),
          name: firstSquad.name,
          owner_id: firstSquad.owner,
          wallet_address: firstSquad.owner,
          formation: "OneThreeTwoOne",
          total_value: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        players: [],
      });
    }
  }, [userSquads, squadWatch.squad.id, form]);

  const hasActiveBids = userBids && userBids.length > 0;

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
    // router.push("/session");
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-offbit text-white">Loading squads...</p>
      </div>
    );
  }

  return (
    <NavWrapper>
      <></>
      <FormProvider {...form}>
        <form
          id="submit-bid-form"
          className="flex flex-col justify-between "
          onSubmit={onSubmit}
        >
          <div className="flex max-w-[23.875rem] mx-auto items-center justify-between h-[3.5rem] w-full mb-[0.5625rem] bg-gray-850 p-[0.5rem] border border-gray-700">
            <div>
              <p className="font-offbit text-[1.375rem] font-[700] leading-[100%] mb-[0.25rem] capitalize">
                {squadWatch?.squad.name || "Select Squad"}
              </p>
              <span className="block text-gray-400 text-[0.875rem] font-[700] leading-[100%] tracking-[0.04em]">
                10% WIN RATE
              </span>
            </div>
            <Button
              type="button"
              className="h-[2.5rem] px-[1.5rem]"
              onClick={() => onOpen()}
              disabled={!squadWatch?.squad?.id}
            >
              PLAY NOW
            </Button>
          </div>

          {squadWatch && (
            <Pitch
              layout={
                formationLayouts[
                  squadWatch?.squad.formation as FormationLayoutKey
                ]
              }
              players={squadWatch?.players}
              onPlayerClick={(player) => {
                console.log("Player clicked:", player);
              }}
              ctaLabel=""
            />
          )}

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
                {squadData?.data.map((squad, index) => (
                  <SquadItem
                    key={squad.squad.id}
                    onClick={() => {
                      console.log("🎯 Squad clicked:", squad.squad.name);
                      form.setValue("squad", squad);
                      console.log("📝 Form value set to:", squad);
                    }}
                    team={squad}
                    selected={squadWatch?.squad.id === squad.squad.id}
                    life={userSquads?.[index]?.life}
                  />
                ))}
              </div>
              <AddNewSquadButton
                onClick={() => navigate("squad/new")}
                classNames="h-[6rem] w-[6rem]"
              />
            </div>
          </div>

          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="bg-gray-850 mx-auto w-full mb-[1rem]">
              <TabsTrigger
                className="font-offbit text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center"
                value="tokens"
              >
                COINS
              </TabsTrigger>
              <TabsTrigger
                className="font-offbit text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center"
                value="pitch"
              >
                PITCH
              </TabsTrigger>
              {hasActiveBids && (
                <TabsTrigger
                  className="font-offbit text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center"
                  value="bids"
                >
                  ACTIVE BIDS
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="tokens" className="px-0">
              {/* Token price list component */}
            </TabsContent>

            <TabsContent value="pitch" className="px-0">
              {/* Squad pitch component */}
            </TabsContent>

            {hasActiveBids && (
              <TabsContent value="bids" className="px-0">
                {/* Active bids list component */}
              </TabsContent>
            )}
          </Tabs>

          <SetHornBid isOpen={isOpen} onClose={onClose} />
        </form>
      </FormProvider>
    </NavWrapper>
  );
}
