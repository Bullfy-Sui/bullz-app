import { Sheet, SheetContent } from "@/components/ui/sheet";
import UserPlayerDp from "@/components/user-player-dp";

interface Props {
  isOpen: boolean;
}

const WinnerMatchEnded = (props: Props) => {
  return (
    <Sheet open={props.isOpen}>
      {/* <SheetTrigger>Open</SheetTrigger> */}
      <SheetContent side="bottom" className="w-full h-full">
        <div className="flex flex-col items-center gap-[0.36125rem]">
          <div className="bg-[#008000] text-[0.875rem] font-offbit font-[700] tracking-[0.04em]">
            (WINNER)
          </div>
          <div className="flex flex-col items-center gap-[0.75rem]">
            <UserPlayerDp imageUrl="/assets/images/owl-nft.jpg" />
            <p className="font-offbit text-[0.875rem] font-[700] leading-[100%] tracking-[0.04em] text-center">
              YOU
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WinnerMatchEnded;
