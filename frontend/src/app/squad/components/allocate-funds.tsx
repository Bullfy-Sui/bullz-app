import TitleBar from "@/components/general/title-bar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import AllocationItem from "./allocation-item";
import { TOTAL_BUDGET } from "../constants";

interface AllocateFundsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AllocateFunds = (props: AllocateFundsProps) => {
  const [remainingBudget, setRemainingBudget] = useState(TOTAL_BUDGET);
  const [allocated, setAllocated] = useState(7);

  return (
    <Sheet open={props.isOpen}>
      <SheetContent side="bottom" className="border-none h-screen">
        <form className="w-[24.375rem] mx-auto px-[1.25rem] overflow-y-scroll">
          <TitleBar title="Allocation of funds" onClick={props.onClose} />
          <div className="bg-modal-bg rounded-[0.375rem] w-full flex items-center justify-between h-[4.25rem] px-[0.75rem] py-[0.875rem]">
            <div>
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-profit-foreground block">
                Budget
              </span>
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-white block">
                ${remainingBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-[8.5rem] ">
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-loss-foreground block">
                Allocation
              </span>
              <span className="text-[0.625rem] leading-[1.25rem] font-[400] text-white block">
                {allocated}%
              </span>
            </div>
          </div>
          <div className="space-y-[0.25rem] mt-[0.76rem]">
            <AllocationItem
              value={10}
              onSlide={(value) => {
                setAllocated((value / TOTAL_BUDGET) * 100);
                setRemainingBudget(TOTAL_BUDGET - value);
              }}
            />
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AllocateFunds;
