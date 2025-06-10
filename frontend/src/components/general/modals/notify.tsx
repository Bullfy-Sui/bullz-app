"use client";
import { FailedIcon, ConnectedIcon, InfoIcon } from "@/components/icons/notification-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import React from "react";

interface NotificationModalProps {
  type: "success" | "error" | "warning"  | "custom";
  title?: string;
  description: React.ReactNode;
  onClose: () => void;
  buttonLabel?: string;
  onButtonClick?: () => void;
  secondaryButtonLabel?: string;
  onSecondaryButtonClick?: () => void;
  isOpen: boolean;
  isLoading: boolean;
}

const NotificationModal = ({
  type,
  title,
  description,
  onClose,
  buttonLabel = "OK",
  onButtonClick,
  secondaryButtonLabel,
  onSecondaryButtonClick,
  isOpen,
  isLoading,
}: NotificationModalProps) => {
  const Icon = {
    success: <ConnectedIcon className="w-12 h-12" />,
    error: <FailedIcon className="w-12 h-12" />,
    warning: <InfoIcon className="w-12 h-12" />,
    custom: null, // or provide a custom icon/component here
  }[type];

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent 
        className="font-[pixel] p-0 border-0 rounded-none max-w-none w-[280px] min-h-[284px] max-h-[90vh] overflow-auto"
        style={{
          background: '#1F1F33',
          boxShadow: 'inset 0px 8px 0px rgba(255, 255, 255, 0.16), inset 0px -8px 0px rgba(0, 0, 0, 0.24)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 24px',
            gap: '16px',
            width: '100%',
          }}
        >
          <DialogTitle className="sr-only">{title || "Notification"}</DialogTitle>
          
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-[#9898B3] text-[1rem] leading-[1.5rem]">
                {description}
              </div>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 flex items-center justify-center">
                {Icon}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#9898B3]">{title}</h2>
                <div className="text-sm leading-[100%] text-[#9898B3]">{description}</div>
              </div>
              {/* Primary Button */}
              {buttonLabel && (
                <Button
                  onClick={onButtonClick || onClose}
                  className="flex flex-row justify-center items-center px-6 py-4 gap-2 w-full max-w-[232px] h-12 bg-[#FF5324] border border-[#992100] uppercase text-white"
                  style={{
                    boxShadow: '0px 3.81818px 2.54545px rgba(0, 0, 0, 0.25), inset 0px 8px 0px rgba(255, 255, 255, 0.24), inset 0px -8px 0px rgba(0, 0, 0, 0.24)',
                  }}
                >
                  {buttonLabel}
                </Button>
              )}
              {/* Secondary Button (e.g., Cancel) */}
              {secondaryButtonLabel && (
                <Button
                  onClick={onSecondaryButtonClick || onClose}
                  className="flex flex-row justify-center items-center px-6 py-4 gap-2 w-full max-w-[232px] h-12 bg-[#32324D] border border-[#161626] uppercase text-white"
                  style={{
                    boxShadow: '0px 3.81818px 2.54545px rgba(0, 0, 0, 0.25), inset 0px 8px 0px rgba(255, 255, 255, 0.24), inset 0px -8px 0px rgba(0, 0, 0, 0.24)',
                  }}
                >
                  {secondaryButtonLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;


