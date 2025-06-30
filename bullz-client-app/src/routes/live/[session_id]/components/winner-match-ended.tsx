import UserPlayerDp from "@/components/general/user-player-dp";
import BullTrophy from "@/components/svg/bull-trophy";
import SpiralLight from "@/components/svg/spiral-light";
import SuiLogo from "@/components/svg/sui.logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Props {
  isOpen: boolean;
  openShareDrawer: () => void;
  onClose: () => void;
}

const WinnerMatchEnded = (props: Props) => {
  return (
    <>
      <Sheet open={props.isOpen}>
        <SheetContent
          side="bottom"
          className="w-full h-full px-[3rem] pt-[5rem]"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-[0.36125rem]">
              <div className="bg-[#008000] text-[0.875rem] font-offbit font-[700] tracking-[0.04em] leading-[100%] p-[0.25rem] text-center justify-center items-center flex ">
                (WINNER)
              </div>
              <div className="flex flex-col items-center gap-[0.75rem]">
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
          <div className="flex items-center relative justify-center">
            <SpiralLight />

            <div
              className=" w-[13.5rem] h-[17rem] absolute rounded-[1.384375rem] py-[0.8125rem]"
              style={{
                background:
                  "linear-gradient(0deg, #008000, #008000), radial-gradient(157.64% 126.11% at 50% -22.86%, #FFFFFF 0%, rgba(255, 255, 255, 0) 65%)",
                backdropFilter: "blur(44px)",
                border: "1px solid",
                borderImageSource:
                  "conic-gradient(from -38.53deg at 85.74% 92.19%, #FFFFFF -0.73deg, rgba(255, 255, 255, 0) 47.71deg, #FFFFFF 133.48deg, rgba(255, 255, 255, 0) 299.42deg, #FFFFFF 359.27deg, rgba(255, 255, 255, 0) 407.71deg)",
              }}
            >
              <div>
                <img
                  src="/public/images/owl-nft.jpg"
                  className="size-[7.5rem] rounded-full mx-auto mb-[0.25rem]"
                />
                <div
                  className="font-[700] w-full text-center flex items-center justify-center h-[2.5rem]"
                  style={{
                    background:
                      "linearGradient(90deg, rgba(0, 0, 0, 0) 0%, #000000 30%, #000000 70%, rgba(0, 0, 0, 0) 100%)",
                  }}
                >
                  <SuiLogo width={20} height={20} className="rounded-full" />
                  <span className="font-[700] block text-white text-[1.375rem]">
                    2
                  </span>
                </div>
                <div className="font-offbit text-[0.875rem] leading-[100%] tracking-[0.04em] font-[700] text-center py-[0.5rem] flex items-center justify-center">
                  YOU JUST WON!
                </div>
                <div
                  className="font-[700] w-full text-center flex items-center justify-center h-[2.25rem]"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                  }}
                >
                  <BullTrophy />
                  +2
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center flex-col justify-center gap-[1rem] mx-auto w-full">
            <Button className="w-full" onClick={props.onClose}>
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
        </SheetContent>
      </Sheet>
    </>
  );
};

export default WinnerMatchEnded;
