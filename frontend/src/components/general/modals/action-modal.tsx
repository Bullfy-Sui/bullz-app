import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  primaryButton?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
  };
}

const ActionModal = (props: ActionModalProps) => {
  return (
    <>
      <Dialog onOpenChange={props.onClose} open={props.isOpen}>
        <DialogContent
          style={{
            boxShadow:
              "0px 3.82px 2.55px 0px #00000040, 0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF3D inset",
          }}
          className="max-w-[17.5rem] bg-gray-800 rounded-none border-none w-[23.875rem] p-0 py-[2rem] px-[1.5rem] "
        >
          {props.children}
          <div className="space-y-[1rem]">
            {props.primaryButton && (
              <Button className="w-full" onClick={props.primaryButton.onClick}>
                {props.primaryButton.label}
              </Button>
            )}
            {props.secondaryButton && (
              <Button
                className="w-full"
                variant={"secondary"}
                onClick={props.secondaryButton.onClick}
              >
                {props.secondaryButton.label}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionModal;
