"use client";

import CautionIcon from "@/components/icons/caution-icon";
import CheckMarkIcon from "@/components/icons/check-mark.icon";
import CircleCloseIcon from "@/components/icons/cirlce-close.icon";
import ErrorHexagonIcon from "@/components/icons/error-hexagon.icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface NotificationModalProps {
  type: "success" | "error" | "warning";
  title: string;
  description: string;
  onClose: () => void;
  buttonLabel: string;
  onButtonClick: () => void;
  isOpen: boolean;
  isLoading: boolean;
}

const NotificationModal = (props: NotificationModalProps) => {
  const Icon = {
    success: <CheckMarkIcon color="#00FF00" />,
    error: <ErrorHexagonIcon />,
    warning: <CautionIcon />,
  }[props.type];
  return (
    <Dialog onOpenChange={props.onClose} open={props.isOpen}>
      <DialogContent className="max-w-[382px] bg-modal-bg rounded-[1.25rem] border-none w-[23.875rem] ">
        {props.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[#949193] text-[1rem] leading-[1.5rem]">
              Authenticating...
            </p>
          </div>
        ) : (
          <div>
            <div
              className="flex items-end justify-end w-full fixed m-[1rem] top-0 right-0 "
              onClick={props.onClose}
            >
              <CircleCloseIcon />
            </div>
            <div className="mt-[2rem] space-y-[1.5rem] flex flex-col items-center">
              <div className="bg-gray-700 rounded-full size-[5rem] flex items-center justify-center ">
                {Icon}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">{props.title}</h2>
                <p className="text-gray-100 text-sm leading-[100%]">
                  {props.description}
                </p>
              </div>
              <Button
                onClick={props.onButtonClick}
                className="h-[2.5rem] w-full"
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
