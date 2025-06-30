import UserPlayerDp from "@/components/general/user-player-dp";
import NavWrapper from "@/components/layout/nav-wrapper";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavLink } from "react-router";

const Player = () => {
  return (
    <div className="space-y-[0.5rem] flex flex-col items-center justify-center">
      <UserPlayerDp
        imageUrl="/public/images/weird-nft.jpg"
        classNames="size-[3.3125rem]"
      />
      <span className="font-[700] block text-[1.0625rem] leading-[100%] tracking-[0.04em] ">
        0xkfjg.....101
      </span>
      {/* <Button variant={"secondary"} className="h-[2rem]">
        VIEW TEAM
      </Button> */}
    </div>
  );
};

const LiveSessions = () => {
  return (
    <NavWrapper>
      <main className="px-[1rem]">
        <Tabs defaultValue="now" className="w-full mx-auto mt-[1rem]">
          <TabsList className="bg-gray-850 mx-auto w-full">
            <TabsTrigger
              className="font-offbit rounded-none text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center"
              value="now"
            >
              NOW
            </TabsTrigger>
            <TabsTrigger
              className="font-offbit rounded-none text-[1.0625rem] font-[700] leading-[100%] tracking-[0.04em] text-center"
              value="ended"
            >
              ENDED
            </TabsTrigger>
          </TabsList>
          <TabsContent value="now" className="px-0"></TabsContent>
          <TabsContent value="ended" className="px-0"></TabsContent>
        </Tabs>
        <NavLink
          to={"90"}
          className="flex items-center justify-between w-full py-[1.5rem] px-[0.5rem] border-b border-[#1F1F33]"
        >
          <Player />
          <Player />
        </NavLink>
      </main>
    </NavWrapper>
  );
};

export default LiveSessions;
