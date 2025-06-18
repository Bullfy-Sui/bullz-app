import DefaultDp from "@/components/svg/default-dp";
import DefaultPlayerDp from "@/components/svg/default-player-dp";
import EmptyPlayerDp from "@/components/svg/empty-player-dp";
import UserPlayer from "@/components/svg/user-player";
import { Button } from "@/components/ui/button";

const LockedHorns = () => {
  return (
    <div>
      <p className="text-center text-gray-300 font-[700] font-offbit text-[1.0625rem] leading-[100%] tracking-[0.04em] my-[1rem]">
        LOOKING FOR SOMEONE...
      </p>
      <div className="flex items-center gap-[0.5rem] w-max mx-auto mb-[1rem]">
        <div className="w-[7rem] flex flex-col gap-[0.5rem] items-center justify-center">
          <UserPlayer
            color="#C2FF5F"
            style={{
              boxShadow: "0px 8.07px 13.45px 0px #00000066",
            }}
          />
          <span className="font-[700] text-[1.0625rem] leading-[100%] tracking-[0.04em]">
            YOU
          </span>
        </div>
        <span className="font-[700] text-gray-300 font-offbit text-[1.0625rem]">
          VS
        </span>

        <div className="w-[7rem] flex flex-col items-center justify-center gap-[0.5rem]">
          <EmptyPlayerDp
            style={{
              boxShadow: "0px 8.07px 13.45px 0px #00000066",
            }}
          />
          <span className="font-[700] text-[1.0625rem] leading-[100%] tracking-[0.04em] text-gray-400 font-offbit">
            ???
          </span>
        </div>
      </div>
      <Button
        type="button"
        className="w-full text-[1.0625rem]"
        variant={"secondary"}
      >
        CANCEL REQUEST
      </Button>
    </div>
  );
};

export default LockedHorns;
