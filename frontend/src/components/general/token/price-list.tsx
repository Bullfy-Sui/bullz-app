import { cn } from "@/lib/utils";
import TokenCard from "./card";
import { useGetPriceList } from "@/common-api-services/token-price.ts";
import { TokenResponse } from "@/common-api-services/token-price.ts/types";
import ChevronRight from "@/components/icons/chevron-right";

interface PriceListProps {
  onSelect?: (args: TokenResponse) => void;
  onClickBack?: () => void;
}

const PriceList = (props?: PriceListProps) => {
  const { data: priceListResponse } = useGetPriceList();
  return (
    <>
      <div className="flex items-center justify-between mt-[1.25rem] mb-[1.5rem]">
        <div className="flex items-center gap-[0.25rem]">
          {props?.onClickBack && <ChevronRight onClick={props?.onClickBack} />}
          <p className="text-gray-300 font-[600] leading-[1.375rem] text-[1.6875rem]">
            TOP COINS
          </p>
        </div>
        <div className="flex gap-[0.1875rem] items-center">
          <div
            className={cn(
              " text-white rounded-[0.125rem] h-[1.625rem] text-center flex items-center justify-center leading-[1.375rem] text-[0.75rem] font-[600] px-[0.625rem] font-geist",
              {
                " bg-button-bg": true,
                " bg-[#1C1D22]": false,
              }
            )}
          >
            30 secs
          </div>
          <div
            className={cn(
              " rounded-[0.125rem] h-[1.625rem] text-center flex items-center justify-center leading-[1.375rem] text-[0.75rem] font-[600] px-[0.625rem] font-geist",
              {
                "text-black bg-button-bg": false,
                "text-white bg-[#1C1D22]": true,
              }
            )}
          >
            1 min
          </div>
        </div>
      </div>
      {priceListResponse?.data.map((token) => (
        <TokenCard
          {...token}
          key={token.token_id}
          // @ts-expect-error - -
          onClick={() => props?.onSelect(token)}
        />
      ))}
    </>
  );
};

export default PriceList;
