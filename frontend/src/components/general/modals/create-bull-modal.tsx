"use client";

import SuiLogo from "@/components/svg/sui.logo";
import ActionModal from "./action-modal";

interface CreateBullModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  cost: number;
  isCreating: boolean;
}

const CreateBullModal = ({
  isOpen,
  onClose,
  onCreate,
  cost,
  isCreating,
}: CreateBullModalProps) => {
  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      primaryButton={{
        label: "CREATE BULL",
        onClick: onCreate,
        isLoading: isCreating,
      }}
      secondaryButton={{
        label: "CANCEL",
        onClick: onClose,
      }}
    >
      <div className="text-center space-y-[1rem]">
        <h2 className="text-xl font-bold font-offbit">CREATE BULL</h2>
        <div className="flex items-center justify-center gap-[0.5rem]">
          <SuiLogo className="size-[2rem] rounded-full" />
          <span className="block font-offbit font-[700] text-[1.6875rem]">
            {cost}
          </span>
        </div>
        <p className="text-gray-300 font-[700] leading-[1.0625rem] tracking-[0.04em] font-offbit">
          CREATING A BULL WILL <br /> COST YOU {cost} SUI
        </p>
      </div>
    </ActionModal>
  );
};

export default CreateBullModal;
