"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[382px] bg-modal-bg rounded-[1.25rem] border-none w-[23.875rem] p-6">
        <div className="text-center space-y-6">
          <h2 className="text-xl font-bold font-[OffBit]">HOW TO PLAY</h2>
          <p className="text-gray-100 text-sm leading-[1.5rem] font-[OffBit]">
            PICK TOKENS TO BUILD YOUR BULL AND LOCK HORNS WITH OTHER PLAYERS. THE BULL WITH THE BETTER TOKEN DIFFERENCE WINS. START BY ADDING A BULL BELOW.
          </p>
          <Button className="w-full" onClick={onClose}>
            I UNDERSTAND
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowToPlayModal;