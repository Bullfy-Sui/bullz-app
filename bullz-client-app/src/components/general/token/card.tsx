import { TokenResponse } from "@/common-api-services/token-price.ts/types";
import SuiLogo from "@/components/svg/sui.logo";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const TokenCardSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
};

interface TokenCardProps extends TokenResponse {
  onClick?: () => void;
}

const TokenCard = (props: TokenCardProps) => {
  const percentageChange = parseFloat(props.percentagePriceChange5m);
  const currentPrice = parseFloat(props.currentPrice);
  
  // Format price better for very small numbers (scientific notation)
  const formatPrice = (price: number) => {
    if (price < 0.0001) {
      return price.toExponential(3);
    }
    return price.toFixed(6);
  };
  
  return (
    <>
      <div
        onClick={props.onClick}
        className="bg-gray-900 border border-white/10 flex items-center justify-between px-[1rem] py-[0.5rem] cursor-pointer hover:bg-gray-800/50 transition-all duration-200 hover:border-white/20"
      >
        <div className="flex gap-[0.75rem]">
          {props.imageUrl ? (
            <img 
              src={props.imageUrl} 
              alt={props.name}
              className="size-[2.75rem] rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
          ) : null}
          {/* Show SuiLogo if no imageUrl or if image fails to load */}
          <SuiLogo className={cn("size-[2.75rem] rounded-full", {
            "hidden": !!props.imageUrl, // Hide if we have an imageUrl (will show if image fails to load)
            "block": !props.imageUrl   // Show immediately if no imageUrl
          })} />
          <div>
            <p className="text-[1rem] leading-[1.375rem] font-[600] flex items-center gap-[0.25rem] capitalize">
              {props?.name.split(" ")[0].toLowerCase()}
            </p>
            <div className="flex items-center gap-[0.25rem]">
              <span className="text-sm leading-[1.125rem] text-[#9DA4AE] font-mono">
                ${formatPrice(currentPrice)}
              </span>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse opacity-60"></div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "font-[700] text-[1.0625rem] tracking-[0.04em] transition-all duration-300 flex items-center gap-[0.25rem]",
            {
              "text-loss-foreground": percentageChange < 0,
              "text-success-foreground": percentageChange > 0,
              "text-gray-400": percentageChange === 0,
            }
          )}
        >
          {percentageChange !== 0 && (
            <span className="text-[0.75rem]">
              {percentageChange > 0 ? "↗" : "↘"}
            </span>
          )}
          {Math.abs(percentageChange).toFixed(2)}%
        </div>
      </div>
    </>
  );
};

export default TokenCard;
