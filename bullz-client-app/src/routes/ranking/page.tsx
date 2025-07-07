import UserPlayerDp from "@/components/general/user-player-dp";
import Header from "@/components/layout/header";
import NavWrapper from "@/components/layout/nav-wrapper";
import NavBar from "@/components/layout/navbar";
import BullTrophy from "@/components/svg/bull-trophy";
import SuiLogo from "@/components/svg/sui.logo";
import { cn } from "@/lib/utils";
import { useState } from "react";

type RankingPeriod = "WEEKLY" | "ALL TIME";
type PlayerRank = {
  id: string;
  avatar: string;
  name: string;
  trophyCount: number;
  points: number;
  rank?: number;
};

const RankingTabs = ({
  active,
  onChange,
}: {
  active: RankingPeriod;
  onChange: (period: RankingPeriod) => void;
}) => {
  return (
    <div className="bg-gray-850 mx-auto w-full flex mb-[1.5rem] p-[0.25rem]">
      {["WEEKLY", "ALL TIME"].map((period) => (
        <button
          key={period}
          onClick={() => onChange(period as RankingPeriod)}
          className={`flex-1 cursor-pointer flex items-center justify-center h-[2.25rem] text-sm font-offbit rounded-none text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center transition-all ${active === period ? "bg-gray-700 text-white" : "text-[#9898b3]"}`}
        >
          {period}
        </button>
      ))}
    </div>
  );
};

const PodiumDisplay = ({ topPlayers }: { topPlayers: PlayerRank[] }) => {
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd place arrangement

  return (
    <div className="flex items-end justify-center ">
      {podiumOrder.map((index) => {
        const player = topPlayers[index];
        const isFirst = index === 1;
        return (
          <div key={player.id} className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-2">
              <UserPlayerDp
                imageUrl="/public/images/owl-nft.jpg"
                classNames="w-[4.15125rem] h-[4.15125rem] rounded-[0.6725rem] border-[0.25rem]"
              />
              <span className="text-sm text-white truncate max-w-[100px] font-[700] leading-[100%] tracking-[0.04em]">
                {player.name}
              </span>
              <div className="flex items-center gap-1">
                <BullTrophy />
                <span className="text-white font-offbit font-[700] text-[0.875rem] leading-[100%] tracking-[0.04em]">
                  {player.trophyCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <SuiLogo className="size-[1rem] rounded-full" />
                <span className="text-white font-offbit font-[700] text-[0.875rem] leading-[100%] tracking-[0.04em]">
                  {player.points}
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute w-[6.875rem] bg-[#FFD2C0] h-[1rem] " />
              <div
                style={{
                  background:
                    "linear-gradient(180deg, #FF5324 0%, #3B0D00 191.8%)",
                }}
                className={cn(
                  `w-[6.875rem] mt-2 bg-[#ff5c16] flex pt-[1rem]  pb-[0.5rem] justify-center `,
                  {
                    "h-[8.125rem]": index === 0,
                    "h-[6.125rem]": index === 1,
                    "h-[6rem]": index === 2,
                  },
                )}
              >
                <span className="text-[5.1875rem] font-[700] text-center font-offbit leading-[100%] tracking-[0.04em] block ">
                  {index + 1}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PlayerList = ({ players }: { players: PlayerRank[] }) => {
  return (
    <div className="space-y-[1px] border border-gray-800 bg-gray-800">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center gap-4 p-4 h-[4.25rem] bg-gray-900"
        >
          <UserPlayerDp
            imageUrl="/public/images/owl-nft.jpg"
            classNames="w-[3rem] h-[3rem] rounded-[0.46125rem] border-[0.171875rem]"
          />
          <div className="flex-1">
            <span className="text-white font-offbit font-[700] text-[1.0625rem] leading-[100%] tracking-[0.04em]">
              {player.name}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <BullTrophy />
              <span className="text-gray-200 font-offbit font-[700] text-[0.875rem] leading-[100%] tracking-[0.04em]">
                {player.trophyCount.toLocaleString()}
              </span>
            </div>
          </div>
          <span className="text-gray-400 font-offbit font-[700] text-[0.875rem] leading-[100%] tracking-[0.04em]">
            {player.rank}
          </span>
        </div>
      ))}
    </div>
  );
};

const RankingPage = () => {
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>("WEEKLY");

  const mockPlayers: PlayerRank[] = [
    {
      id: "1",
      avatar: "https://placekitten.com/100/100",
      name: "0xam9....283",
      trophyCount: 1394,
      points: 13.2,
    },
    {
      id: "2",
      avatar: "https://placekitten.com/100/100",
      name: "0xk1jg....101",
      trophyCount: 1394,
      points: 13.2,
    },
    {
      id: "3",
      avatar: "https://placekitten.com/100/100",
      name: "0xam9....283",
      trophyCount: 1394,
      points: 13.2,
    },
    // Add more players for the list
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `${i + 4}`,
      avatar: "https://placekitten.com/100/100",
      name: "0xam9....283",
      trophyCount: 1394,
      points: 13.2,
      rank: i + 4,
    })),
  ];

  return (
    <NavWrapper>
      <main className="px-[1.5rem]">
        <RankingTabs active={activePeriod} onChange={setActivePeriod} />
        <PodiumDisplay topPlayers={mockPlayers.slice(0, 3)} />
        <PlayerList players={mockPlayers.slice(3)} />
      </main>
    </NavWrapper>
  );
};

export default RankingPage;
