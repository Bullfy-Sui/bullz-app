import FinishFlag from "@/components/svg/finish-flag";
import RaceDotGrid from "@/components/svg/race-dot-grid";
import UserPlayer from "@/components/svg/user-player";
import { SVGProps } from "react";

const Tick = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="3"
      height="116"
      viewBox="0 0 3 116"
      fill="none"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect y="6" width="3" height="104" fill="currentColor" />
      <line
        x1="1.25"
        y1="1.09278e-08"
        x2="1.24999"
        y2="116"
        stroke="currentColor"
        stroke-width="0.5"
      />
    </svg>
  );
};

const RaceTrack = () => {
  return (
    <div className="h-[25rem] rounded-[1rem] w-[23.875rem] mx-auto border border-gray-800 flex items-center">
      <div className=" absolute flex flex-col gap-[0.75rem]">
        <div className="flex items-center gap-[0.5rem]">
          <div className="flex gap-[0.1875rem]">
            <Tick color="#00FF00" />
            <Tick color="#00FF00" />
            <Tick color="#00FF00" />
          </div>
          <div className="flex gap-[0.5rem] items-center">
            <UserPlayer width={24} height={24} />
            <span className="font-offbit text-success-foreground font-[700] text-[0.875rem] leading-[100%] tracking-[0.04em]">
              +0.15%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-[0.5rem]">
          <div className="flex gap-[0.1875rem]">
            <Tick color="#FF9999" />
            <Tick color="#FF9999" />
            <Tick color="#FF9999" />
          </div>
          <div className="flex gap-[0.5rem] items-center">
            <UserPlayer width={24} height={24} />
            <span className="font-offbit text-loss-foreground font-[700] text-[0.875rem] leading-[100%] tracking-[0.04em]">
              +0.15%
            </span>
          </div>
        </div>
      </div>
      <RaceDotGrid />
      <div className="bg-gray-850 h-full w-[2.0625rem] flex items-center justify-center rounded-tr-[1rem] rounded-br-[1rem]">
        <FinishFlag />
      </div>
    </div>
  );
};

export default RaceTrack;
