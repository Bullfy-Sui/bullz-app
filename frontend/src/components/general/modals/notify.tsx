"use client";

import CautionIcon from "@/components/icons/caution-icon";
import CheckMarkIcon from "@/components/icons/check-mark.icon";
import ErrorExclamation from "@/components/icons/error-exclamation";
import InfoBulbIcon from "@/components/icons/info-bulb.icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NotificationStatus } from "@/lib/hooks/use-notifications-modal";

interface NotificationModalProps {
  status: NotificationStatus;
  description?: string;
  onClose: () => void;
  isOpen: boolean;
  title?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

const NotificationModal = (props: NotificationModalProps) => {
  const Icon = {
    success: (
      <CheckMarkIcon className=" h-[1rem] w-[1.375rem] " color="#00FF00" />
    ),
    error: <ErrorExclamation className="size-[1.5rem]" />,
    warning: <CautionIcon />,
    loading: <></>,
    info: <InfoBulbIcon className="size-[1.5rem]" />,
  }[props.status];
  return (
    <Dialog open={props.isOpen}>
      <DialogContent
        style={{
          boxShadow:
            "0px 3.82px 2.55px 0px #00000040, 0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF3D inset",
        }}
        className="max-w-[17.5rem] bg-gray-800 rounded-none border-none w-[23.875rem] p-0 py-[2rem] px-[1.5rem] "
      >
        {props.status === "loading" ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-white font-[700] text-center tracking-[0.04em] text-[1.375rem] uppercase leading-[100%]">
              {props.description}
            </p>
          </div>
        ) : (
          <div>
            <div className=" space-y-[1rem] flex flex-col items-center">
              <>{Icon}</>
              <div className="text-center">
                <h2 className="uppercase text-[1.0625rem] font-[700] tracking-[0.04em] leading-[100%] mb-[1rem]">
                  {props.title}
                </h2>
                <p className="text-gray-300 uppercase text-[1.0625rem] tracking-[0.04em] font-[700] text-center leading-[100%]">
                  {props.description}
                </p>
              </div>
              <Button
                onClick={props.onButtonClick}
                className="h-[3rem] w-max px-[1.5rem] cursor-pointer"
              >
                {props.buttonLabel}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;
