import { cn } from "@/lib/utils";
import TokenCard from "./card";

interface PriceListProps {
  onSelect?: () => void;
}

const PriceList = (props?: PriceListProps) => {
  return (
    <>
      <div className="flex items-center justify-between mt-[1.25rem] mb-[1.5rem]">
        <p className="text-white font-[600] leading-[1.375rem] text-[1rem]">
          Top coins
        </p>
        <div className="flex gap-[0.1875rem] items-center">
          <div
            className={cn(
              " rounded-[0.125rem] h-[1.625rem] text-center flex items-center justify-center leading-[1.375rem] text-[0.75rem] font-[600] px-[0.625rem] font-geist",
              {
                "text-black bg-button-bg": true,
                "text-white bg-[#1C1D22]": false,
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
      <TokenCard onClick={props?.onSelect} />
      {/* <TokenCard />
      <TokenCard />
      <TokenCard />
      <TokenCard />
      <TokenCard />
      <TokenCard />
      <TokenCard />
      <TokenCard />
      <TokenCard />
      <TokenCard /> */}
    </>
  );
};

export default PriceList;
