import { TokenResponse } from "@/common-api-services/token-price.ts/types";
import CheckBadge from "@/components/icons/check-badge";
import SuiLogo from "@/components/svg/sui.logo";
import { cn } from "@/lib/utils";

interface TokenCardProps extends TokenResponse {
  onClick?: () => void;
}

const TokenCard = (props: TokenCardProps) => {
  return (
    <div
      onClick={props.onClick}
      className="bg-gray-900 border border-white/10  flex items-center  justify-between px-[1rem] py-[0.5rem] cursor-pointer"
    >
      <div className="flex gap-[0.75rem]">
        {/* <SolanaLogo /> */}
        <SuiLogo className="size-[2.75rem] rounded-full" />
        <div>
          <p className="text-[1rem] leading-[1.375rem] font-[600] flex items-center gap-[0.25rem] capitalize">
            {props?.name.split("/")[0].toLowerCase()}
          </p>
          <span className="text-sm leading-[1.125rem] text-[#9DA4AE] ">
            ${Number(props?.price_30s.toFixed(4)).toLocaleString()}
          </span>
        </div>
      </div>
      <div
        className={cn("  text-sm rounded-[0.25rem] p-[0.125rem]", {
          "bg-loss-foreground/30 text-loss-foreground":
            props.fluctuation_pct < 0,
          "bg-success-opacity1 text-success-foreground":
            props.fluctuation_pct > 0,
        })}
      >
        {props.fluctuation_pct.toFixed(2)}%
      </div>
    </div>
  );
};

export default TokenCard;
