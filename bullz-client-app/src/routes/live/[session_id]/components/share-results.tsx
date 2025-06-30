import BottomSheet from "@/components/general/bottom-sheet";
import GameController from "@/components/icons/game-controller";
import BullTrophy from "@/components/svg/bull-trophy";
import SuiLogo from "@/components/svg/sui.logo";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ShareResults = (props: Props) => {
  return (
    <>
      <BottomSheet isOpen={props.isOpen} onClose={props.onClose}>
        <div>
          <div className="space-y-[1rem] flex flex-col items-center">
            <GameController />
            <p className="font-offbit text-white text-[1.375rem] font-[700] leading-[100%] tracking-[0.04em]">
              SHARE RESULT
            </p>
          </div>

          <div className="flex items-center justify-center">
            {/* winner card */}
            <div
              className="w-[11rem] h-[17rem] py-[0.8125rem] my-[2rem]"
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

            {/* losser card */}
            <div
              className="w-[11rem] h-[17rem] py-[0.8125rem] my-[2rem]"
              style={{
                background:
                  "linear-gradient(0deg, var(--Gray-Gray700, #32324D), var(--Gray-Gray700, #32324D)), radial-gradient(157.64% 126.11% at 50% -22.86%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 65%)",
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

          <div className=" w-full space-y-[1rem]">
            <Button className="w-full">RESULT</Button>
            <div className="flex items-center justify-center w-full gap-[0.5rem]">
              <Button variant={"secondary"} className="w-1/2">
                COPY
              </Button>
              <Button variant={"secondary"} className="w-1/2">
                DOWNLOAD
              </Button>
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default ShareResults;
