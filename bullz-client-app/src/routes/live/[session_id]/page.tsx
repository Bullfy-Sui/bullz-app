"use client";

import TitleBar from "@/components/general/title-bar";
import SuiLogo from "@/components/svg/sui.logo";
import UserPlayerDp from "@/components/general/user-player-dp";
import RaceTrack from "../components/race-track";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useNavigate } from "react-router";
import WinnerMatchEnded from "./components/winner-match-ended";
import LosserMatchEnded from "./components/losser-match-ended";
import ShareResults from "./components/share-results";

const Player = () => {
  return (
    <div className="space-y-[0.5rem] flex flex-col items-center justify-center">
      <UserPlayerDp imageUrl="/public/images/weird-nft.jpg" />
      <span className="font-[700] block text-[1.0625rem] leading-[100%] tracking-[0.04em] ">
        0xkfjg.....101
      </span>
      {/* <Button variant={"secondary"} className="h-[2rem]">
        VIEW TEAM
      </Button> */}
    </div>
  );
};

const LiveSessionPage = () => {
  const navigate = useNavigate();
  const {
    isOpen: winningSheetIsOpen,
    onClose: closeWinningSheet,
    onOpen: openWinningSheet,
  } = useDisclosure();
  const {
    isOpen: shareDrawerIsOpen,
    onOpen: openShareDrawer,
    onClose: closeShareDrawer,
  } = useDisclosure();
  const {
    isOpen: lossingSheetIsOpen,
    onClose: closeLossingSheet,
    onOpen: openLossingSheet,
  } = useDisclosure();
  return (
    <>
      <TitleBar title="LIVE MATCH" onClick={() => navigate("/live")} />
      <div className="mt-[1.5rem] w-max mx-auto">
        <p className="text-gray-300 font-[700] font-offbit leading-[100%] tracking-[0.04em] text-center mb-[2rem]">
          MATCH IN PROGRESS
        </p>
        <div
          className="flex items-center gap-[0.5rem]"
          onClick={openLossingSheet}
        >
          <Player />
          <span className="font-[700] text-gray-300 font-offbit">VS</span>
          <Player />
        </div>
      </div>
      <div className=" mb-[2rem] mt-[0.25rem] w-full">
        <div className="flex items-center justify-center h-[2.25rem] gap-1">
          <SuiLogo width={20} height={20} className="rounded-full" />
          <span className="font-[700] block text-white text-[1.375rem]">2</span>
        </div>

        <div className="font-[700] w-full text-center flex items-center justify-center h-[2.25rem]  bg-gradient-to-l from-[#000019] via-[#1F1F33] to-[#000019]">
          60S
        </div>
      </div>
      <RaceTrack />
      <WinnerMatchEnded
        isOpen={winningSheetIsOpen}
        openShareDrawer={openShareDrawer}
        onClose={closeWinningSheet}
      />
      <LosserMatchEnded
        isOpen={lossingSheetIsOpen}
        openShareDrawer={openShareDrawer}
        onClose={closeLossingSheet}
      />
      <ShareResults isOpen={shareDrawerIsOpen} onClose={closeShareDrawer} />
    </>
  );
};
export default LiveSessionPage;
