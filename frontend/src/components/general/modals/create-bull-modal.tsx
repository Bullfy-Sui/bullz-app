"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CreateBullModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  cost: number;
  isCreating: boolean;
}

const CreateBullModal = ({ isOpen, onClose, onCreate, cost, isCreating }: CreateBullModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[382px] bg-modal-bg rounded-[1.25rem] border-none w-[23.875rem] p-6">
        <div className="text-center space-y-6">
          <h2 className="text-xl font-bold font-[OffBit]">CREATE BULL</h2>
          <p className="text-gray-100 text-sm leading-[1.5rem] font-[OffBit]">
            CREATING A BULL WILL COST YOU {cost} SUI
          </p>
          <Button
            className="w-full"
            onClick={onCreate}
            disabled={isCreating}
            variant="default"
          >
            CREATE BULL
          </Button>
          <Button className="w-full" onClick={onClose} variant="secondary">
            CANCEL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBullModal;