import { TokenResponse } from "@/common-api-services/token-price.ts/types";
import SuiLogo from "@/components/svg/sui.logo";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

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
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const percentageChange = parseFloat(props.percentagePriceChange5m);
  const currentPrice = parseFloat(props.currentPrice);
  
  // Format price better for very small numbers (scientific notation)
  const formatPrice = (price: number) => {
    if (price < 0.0001) {
      return price.toExponential(3);
    }
    return price.toFixed(6);
  };
  
  const handleImageError = () => {
    console.log(`❌ Image failed to load for ${props.symbol}:`, {
      imageUrl: props.imageUrl,
      symbol: props.symbol,
      name: props.name,
      coinAddress: props.coinAddress
    });
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully for ${props.symbol}:`, props.imageUrl);
    setImageError(false);
    setImageLoading(false);
  };
  
  // Reset states when imageUrl changes
  useEffect(() => {
    if (props.imageUrl) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [props.imageUrl]);
  
  const showFallback = !props.imageUrl || imageError;
  
  return (
    <>
      <div
        onClick={props.onClick}
        className="bg-gray-900 border border-white/10 flex items-center justify-between px-[1rem] py-[0.5rem] cursor-pointer hover:bg-gray-800/50 transition-all duration-200 hover:border-white/20"
      >
        <div className="flex gap-[0.75rem] items-center">
          <div className="relative size-[2.75rem] rounded-full overflow-hidden">
            {!showFallback && (
              <>
                <img 
                  src={props.imageUrl} 
                  alt={props.name}
                  className="size-[2.75rem] rounded-full object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
                {imageLoading && (
                  <div className="size-[2.75rem] rounded-full bg-gray-700 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            )}
            {showFallback && (
              <div className="size-[2.75rem] rounded-full bg-gray-700 flex items-center justify-center">
                <SuiLogo className="size-[2rem]" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col">
            <p className="text-[1rem] leading-[1.375rem] font-[600] flex items-center gap-[0.25rem] capitalize text-white">
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
