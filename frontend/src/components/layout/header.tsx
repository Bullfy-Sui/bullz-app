"use client";

import { useAppStore } from "@/lib/store/app-store";
import DefaultDp from "../svg/default-dp";
import SuiCoin from "../svg/sui-coin";
import BullTrophy from "../svg/bull-trophy";
import PlusCircle from "../icons/plus-circle.icon";

const Header = () => {
  const { address } = useAppStore();

  return (
    <div className="flex items-center justify-between mt-[2.8125rem] mb-[1.62875rem]">
      <div className="gap-[0.5rem] flex items-center">
        <DefaultDp />
        <span className="font-[600] leading-[100%] text-sm w-[7.5625rem] truncate">
          {address}
        </span>
      </div>
      <div className="bg-[#141A28] rounded-l-[0.316875rem] text-white flex items-center">
        <div className="flex items-center">
          <SuiCoin />
          <span className="leading-[150%] font-[600] text-[0.60625rem] ">
            4.12
          </span>
        </div>
        <div className="flex items-center">
          <BullTrophy />
          <span className="leading-[150%] font-[600] text-[0.60625rem] ">
            4,123
          </span>
        </div>
        <div className="bg-gray-700 p-[0.316875rem] rounded-r-[0.316875rem] mr-[0.1875rem]">
          <PlusCircle />
        </div>
      </div>
    </div>
  );
};

export default Header;
