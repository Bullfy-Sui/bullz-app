import CheckBadge from "@/components/icons/check-badge";
import SolanaLogo from "@/components/svg/sol.logo";
import React from "react";

interface TokenCardProps {
  onClick?: () => void;
}

const TokenCard = (props: TokenCardProps) => {
  return (
    <div
      onClick={props.onClick}
      className="bg-[#111111] border border-white/10 rounded-[0.625rem] flex items-center  justify-between px-[1rem] py-[0.5rem] cursor-pointer"
    >
      <div className="flex gap-[0.75rem]">
        <SolanaLogo />
        <div>
          <p className="text-[1rem] leading-[1.375rem] font-[600] flex items-center gap-[0.25rem]">
            Solana <CheckBadge />
          </p>
          <span className="text-sm leading-[1.125rem] text-[#9DA4AE] ">
            $86.39b
          </span>
        </div>
      </div>
      <div className="bg-success-opacity1 text-success-foreground text-sm rounded-[0.25rem] p-[0.125rem]">
        +0.15%
      </div>
    </div>
  );
};

export default TokenCard;
