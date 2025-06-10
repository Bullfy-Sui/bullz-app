import { useRegister } from "@/app/login/api-services";
import NotificationModal from "@/components/general/modals/notify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store/app-store";
import { useConnectWallet, useWallets } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface ConnectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notificationIsOpen: boolean;
  notificationOnClose: () => void;
  notificationOnButtonClick?: () => void;
  notificationButtonLabel?: string;
  notificationType?: "success" | "error" | "warning" | "custom";
  notificationIsLoading?: boolean;
  notificationTitle?: string;
  notificationDescription?: string;
}

const ConnectDrawer = (props: ConnectDrawerProps) => {
  const wallets = useWallets();
  const {
    mutate: connect,
    isPending: connectingWallet,
    isSuccess: connectionSuccess,
    isError: connectionError,
  } = useConnectWallet();
  const {
    mutate: registerUser,
    isPending: registering,
    isSuccess: registrationSuccess,
    isError: registrationError,
  } = useRegister();
  const { setAddress } = useAppStore();
  const router = useRouter();

  const modalContent = useMemo(() => {
    if (registrationSuccess) {
      return {
        title: "CONNECTED",
        description: "YOUR WALLET HAS BEEN CONNECTED. YOU CAN START PLAYING NOW.",
        buttonLabel: "CONTINUE",
        type: "success" as const,
      }
    }
    if (registrationError) {
      return {
        title: "FAILED",
        description: "WE COULDN'T CONNECT YOUR WALLET. TRY AGAIN OR USE A DIFFERENT WALLET",
        buttonLabel: "CLOSE",
        type: "error" as const,
      }
    }
    if (connectionError) {
      return {
        title: "FAILED",
        description: "WALLET CONNECTION FAILED. PLEASE TRY AGAIN.",
        buttonLabel: "CLOSE",
        type: "error" as const,
      }
    }
    if (connectingWallet) {
      return {
        title: "",
        description: "CONNECTING WALLET...",
        buttonLabel: "CANCEL",
        type: "warning" as const,
      }
    }
    if (registering) {
      return {
        title: "",
        description: "REGISTERING USER...",
        buttonLabel: "CANCEL",
        type: "warning" as const,
      }
    }
    return null
  }, [registrationSuccess, registrationError, connectionError, connectingWallet, registering])

  const onConnect = (res: { accounts: { address: string }[] }) => {
    console.log(res);
    console.log("connected");
    setAddress(res.accounts[0].address);
    router.push("/squad");
  };

  return (
    <>
      <Dialog onOpenChange={props.onClose} open={props.isOpen}>
        <DialogContent className="max-w-[382px] bg-modal-bg rounded-[1.25rem] border-none w-[23.875rem] ">
          <DialogTitle>Connect Wallet</DialogTitle>
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                className="w-full text-center border bg-transparent rounded-[1.25rem] border-waitlist-form-border"
                onClick={() => {
                  if (props.notificationOnButtonClick) {
                    props.notificationOnButtonClick();
                  }
                  connect(
                    { wallet },
                    {
                      onSuccess: onConnect,
                    }
                  );
                }}
              >
                Connect to {wallet.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <NotificationModal
        isOpen={props.notificationIsOpen}
        onClose={props.notificationOnClose}
        onButtonClick={props.notificationOnButtonClick}
        buttonLabel={props.notificationButtonLabel || modalContent?.buttonLabel}
        type={
          (props.notificationType && ["error", "success", "warning", "custom"].includes(props.notificationType)
            ? props.notificationType
            : undefined) ||
          (modalContent?.type && ["error", "success", "warning", "custom"].includes(modalContent.type)
            ? modalContent.type
            : "custom")
        }
        isLoading={props.notificationIsLoading || registering || connectingWallet}
        title={props.notificationTitle || modalContent?.title}
        description={props.notificationDescription || modalContent?.description}
      />
    </>
  );
};

export default ConnectDrawer;
