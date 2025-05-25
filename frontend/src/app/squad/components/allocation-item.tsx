import CheckBadge from "@/components/icons/check-badge";
import SuiLogo from "@/components/svg/sui.logo";
import { Slider } from "@/components/ui/slider";
import { TOTAL_BUDGET } from "../constants";

interface AllocationItemProps {
  onSlide: (value: number) => void;
  value: number;
  name: string;
}

const AllocationItem = (props: AllocationItemProps) => {
  return (
    <>
      <div className="bg-modal-bg border border-white/10 rounded-[0.625rem]  px-[1rem] py-[1rem] cursor-pointer">
        <div className="flex items-center  justify-between mb-[1rem]">
          <div className="flex gap-[0.75rem]">
            {/* <SolanaLogo /> */}
            <SuiLogo className="size-[2.75rem] rounded-full" />
            <div>
              <p className="text-[1rem] leading-[1.375rem] font-[600] flex items-center gap-[0.25rem]">
                {props?.name} <CheckBadge />
              </p>
              <span className="text-sm leading-[1.125rem] text-[#9DA4AE] ">
                ${props.value.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-white text-sm rounded-[0.25rem] p-[0.125rem]">
            {((props.value / TOTAL_BUDGET) * 100).toFixed(2)}%
          </div>
        </div>
        <Slider
          defaultValue={[1]}
          max={TOTAL_BUDGET}
          step={1}
          value={[props.value]}
          onValueChange={(value) => props.onSlide(value[0])}
          className={
            "bg-slider-bg rounded-full h-[1rem] border border-slider-border"
          }
        />
      </div>
    </>
  );
};

export default AllocationItem;
