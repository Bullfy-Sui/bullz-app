import TitleBar from "@/components/general/title-bar";
import ArrowUpIcon from "@/components/icons/arrow-up.icon";
import {
  PlayerResponse,
  SquadResponseItem,
} from "@/routes/squad/api-services/types";
import Pitch from "@/routes/squad/components/pitch";
import SquadItem from "@/routes/squad/components/squad-item";
import { formationLayouts } from "@/routes/squad/constants";
import { useNavigate } from "react-router";

const DummyplayerWithValues: PlayerResponse = {
  id: "1",
  name: "Sui",
  position: 1,
  squad_id: "1",
  token_price_id: "1",
  multiplier: 1,
};

//I need a dummy SquadResponseItem
const DummySquadResponseItem: SquadResponseItem = {
  players: [
    DummyplayerWithValues,
    DummyplayerWithValues,
    DummyplayerWithValues,
  ],
  squad: {
    created_at: "",
    formation: "",
    id: "",
    name: "drago",
    owner_id: "",
    total_value: 0,
    updated_at: "",
    wallet_address: "",
  },
};

const TeamInfoPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <TitleBar title="TEAM INFO" onClick={() => navigate(-1)} />
      <div className="flex items-center justify-between max-w-[23.875rem] mx-auto  h-[3rem] w-full mb-[0.5625rem] bg-gray-850 p-[0.5rem] border border-gray-700 mt-[2.090625rem]">
        <p className="font-offbit text-[1.375rem] font-[700]">FIGHTERS</p>

        <div className="flex items-center gap-[0.5rem]">
          <ArrowUpIcon />
          <span className="text-success-foreground text-[1.0625rem] font-offbit font-[700] leading-[100%] tracking-[0.04em]">
            LONG 0.10
          </span>
        </div>
      </div>

      <Pitch
        layout={formationLayouts.OneTwoOneThree}
        players={DummySquadResponseItem.players}
        onPlayerClick={(player) => {
          console.log("Player clicked:", player);
        }}
        ctaLabel=""
      />

      <div
        style={{
          boxShadow: "0px 4px 0px 0px #FFFFFF29 inset",
        }}
        className="bg-gray-850  w-full px-[1.5rem] py-[1rem] h-[12rem] flex flex-col items-center justify-center"
      >
        <span className="text-gray-300 font-[700] text-center font-offbit block text-[0.875rem] leading-[100%] mb-[0.5rem] ">
          TEAMS
        </span>
        <div className="flex items-center justify-center gap-[0.5rem] ">
          <div className="flex items-center gap-[0.5rem] w-min overflow-x-scroll ">
            {[1, 2, 3].map((squad, index) => (
              <SquadItem
                key={squad}
                onClick={() => {
                  console.log("🎯 Squad clicked:", squad);
                }}
                team={DummySquadResponseItem}
                selected={squad === 0}
                life={4}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamInfoPage;
