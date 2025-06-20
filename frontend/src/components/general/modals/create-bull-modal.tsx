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
        <h2 className="text-xl font-bold offbit-font">CREATE BULL</h2>
        <div className="flex items-center justify-center gap-[0.5rem]">
          <SuiLogo className="size-[2rem] rounded-full" />
          <span className="block offbit-font text-[1.6875rem]">{cost}</span>
        </div>
        <p className="text-gray-100 text-sm leading-[1.5rem] offbit-font">
          CREATING A BULL WILL <br /> COST YOU {cost} SUI
        </p>
      </div>
    </ActionModal>
  );
};

export default CreateBullModal;
