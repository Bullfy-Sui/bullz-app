import TitleBar from "@/components/general/title-bar";

import RaceTrack from "../components/race-track";
import UserPlayer from "@/components/svg/user-player";
import { Button } from "@/components/ui/button";
import SuiLogo from "@/components/svg/sui.logo";
import { useNavigate } from "react-router";

const Player = () => {
  return (
    <div className="space-y-[0.5rem] flex flex-col items-center justify-center">
      <UserPlayer />
      <span className="font-[700] block text-[1.0625rem] leading-[100%] tracking-[0.04em] ">
        0xkfjg.....101
      </span>
      <Button variant={"secondary"} className="h-[2rem]">
        VIEW TEAM
      </Button>
    </div>
  );
};

const LiveSessionPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <TitleBar title="LIVE MATCHES" onClick={() => navigate("/live")} />
      <div className="mt-[1.5rem] w-max mx-auto">
        <p className="text-gray-300 font-[700] font-offbit leading-[100%] tracking-[0.04em] text-center mb-[2rem]">
          MATCH IN PROGRESS
        </p>
        <div className="flex items-center gap-[0.5rem]">
          <Player />
          <span className="font-[700] text-gray-300 font-offbit">VS</span>
          <Player />
        </div>
      </div>
      <div className=" mb-[2rem] mt-[0.25rem] w-full">
        <div className=" flex items-center justify-center  h-[2.25rem]">
          <SuiLogo width={20} height={20} className="rounded-full" />
          <span className="font-[700] block text-white text-[1.375rem]">2</span>
        </div>

        <div className="font-[700] w-full text-center flex items-center justify-center h-[2.25rem]  bg-gradient-to-l from-[#000019] via-[#1F1F33] to-[#000019]">
          60S
        </div>
      </div>
      <RaceTrack />
    </>
  );
};
export default LiveSessionPage;
