import UserPlayerDp from "@/components/general/user-player-dp";
import BullTrophy from "@/components/svg/bull-trophy";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Props {
  isOpen: boolean;
  openShareDrawer: () => void;
  onClose: () => void;
}

const LosserMatchEnded = (props: Props) => {
  return (
    <>
      <Sheet open={props.isOpen}>
        <SheetContent
          side="bottom"
          className="w-full h-full px-[3rem] pt-[5rem] flex flex-col justify-center"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-[0.36125rem] ">
              <div className="flex flex-col items-center gap-[0.75rem] relative">
                <div className="bg-[#008000] text-[0.875rem] font-offbit font-[700] tracking-[0.04em] leading-[100%] p-[0.25rem] flex text-center justify-center items-center  absolute z-10 bottom-5">
                  <span>(WINNER)</span>
                </div>
                <UserPlayerDp
                  imageUrl="/public/images/owl-nft.jpg"
                  classNames="w-[3rem] h-[3rem] rounded-[0.46125rem] border-[0.171875rem]"
                />
                <p className="font-offbit text-[0.875rem] font-[700] leading-[100%] tracking-[0.04em] text-center">
                  YOU
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-400 block text-[0.875rem] font-[700] leading-[100%] tracking-[0.04em] font-offbit">
                MATCH ENDED
              </span>
              <span className="text-white font-offbit leading-[100%] tracking-[0.04em] font-[700] text-[1.0625rem] ">
                -0.23 : -0.04%
              </span>
              <span className="text-gray-400  block text-[0.875rem] font-[700] leading-[100%] tracking-[0.04em] font-offbit">
                1m
              </span>
            </div>
            <div className="flex flex-col items-center gap-[0.36125rem]">
              <div className="flex flex-col items-center gap-[0.75rem]">
                <UserPlayerDp
                  imageUrl="/public/images/owl-nft.jpg"
                  classNames="w-[3rem] h-[3rem] rounded-[0.46125rem] border-[0.171875rem]"
                />
                <p className="font-offbit text-[0.875rem] font-[700] leading-[100%] tracking-[0.04em] text-center">
                  0xjden.....100
                </p>
              </div>
            </div>
          </div>
          <div className="w-[17.5625rem] mx-auto space-y-[2rem] mt-[2rem]">
            <div className="flex flex-col items-center justify-center">
              <BullTrophy
                width={160}
                height={160}
                style={{ filter: "grayscale(1)" }}
              />
              <p className="text-gray-400 block text-[1.0625rem] text-center font-[700] leading-[100%] tracking-[0.04em] font-offbit">
                YOU LOST THIS TIME. FEEL FREE TO MAKE ANOTHER BULL RUN
              </p>
            </div>
            <div className="flex items-center flex-col justify-center gap-[1rem] mx-auto w-full">
              <Button className="w-full" onClick={() => props.onClose()}>
                GOT IT
              </Button>
              <Button
                variant={"secondary"}
                className="w-full"
                onClick={() => props.openShareDrawer()}
              >
                SHARE RESULT
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default LosserMatchEnded;
