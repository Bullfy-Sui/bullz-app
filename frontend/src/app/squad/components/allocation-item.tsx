import CheckBadge from "@/components/icons/check-badge";
import SolanaLogo from "@/components/svg/sol.logo";
import { Slider } from "@/components/ui/slider";

interface AllocationItemProps {
  onSlide: (value: number) => void;
  value: number;
}

const AllocationItem = (props: AllocationItemProps) => {
  return (
    <>
      <div
        //   onClick={props.onClick}
        className="bg-modal-bg border border-white/10 rounded-[0.625rem]  px-[1rem] py-[1rem] cursor-pointer"
      >
        <div className="flex items-center  justify-between mb-[1rem]">
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
        <Slider
          defaultValue={[1]}
          max={10_000_000}
          step={1}
          onValueChange={(value) => props.onSlide(value[0])}
          // value={[props.value]}
          className={
            "bg-slider-bg rounded-full h-[1rem] border border-slider-border"
          }
        />
      </div>
    </>
  );
};

export default AllocationItem;
