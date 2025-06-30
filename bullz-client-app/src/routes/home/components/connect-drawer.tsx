import BottomSheet from "@/components/general/bottom-sheet";
import NotificationModal from "@/components/general/modals/notify";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import {
  NotificationStatus,
  useNotificationsModal,
} from "@/lib/hooks/use-notifications-modal";
import { useAppStore } from "@/lib/store/app-store";
import { useConnectWallet, useWallets } from "@mysten/dapp-kit";
import { useNavigate } from "react-router";

interface ConnectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectDrawer = (props: ConnectDrawerProps) => {
  const wallets = useWallets();
  const {
    mutate: connect,
    isPending: connectingWallet,
    status: connectionStatus,
  } = useConnectWallet();
  const { setAddress } = useAppStore();
  const navigate = useNavigate();
  const loading = connectionStatus === "pending" || connectionStatus === "idle";
  const {
    onOpen: openNotificationDrawer,
    onClose: closeNotificationDrawer,
    isOpen: notificationIsOpen,
    disclosedData: notificationModalStatus,
  } = useDisclosure<NotificationStatus | null>(
    loading ? "loading" : connectionStatus,
  );

  const modalContent = useNotificationsModal({
    status: notificationModalStatus,
    errorContent: {
      title: "FAILED",
      description:
        "WE COULDN’T CONNECT YOUR WALLET. TRY AGAIN OR USE A DIFFERENT WALLET",
      buttonLabel: "Close",
      onButtonClick: () => {
        console.log("error");
      },
    },
    successContent: {
      title: "CONNECTED",
      description: "YOUR WALLET HAS BEEN CONNECTED. YOU CAN START PLAYING NOW",
      buttonLabel: "Continue",
      onButtonClick: () => {
        console.log("connected");
        navigate("/");
        closeNotificationDrawer();
      },
    },
    loadingContent: {
      title: "",
      description: "Connecting wallet...",
      buttonLabel: "",
      onButtonClick: () => {
        console.log("loading");
      },
    },
  });

  const onConnect = (res) => {
    console.log(res);
    console.log("connected");
    setAddress(res.accounts[0].address);
  };

  return (
    <>
      <BottomSheet isOpen={props.isOpen} onClose={props.onClose}>
        <div className="space-y-4 w-full mx-auto">
          <p className="text-gray-300 font-[700] font-offbit block text-[0.875rem] leading-[100%] mb-[0.5rem] ">
            CONNECT WALLET
          </p>

          <div className="flex flex-col items-center gap-[0.5rem]">
            {wallets.map((wallet) => (
              <Button
                variant={"secondary"}
                key={wallet.name}
                className="bg-gray-800 cursor-pointer font-[700] text-[0.875rem] leading-[100%] flex flex-col items-center justify-center gap-[0.79rem]  w-full h-[3.25rem]"
                style={{
                  boxShadow:
                    "0px -8px 0px 0px #0000003D inset, 0px 8px 0px 0px #FFFFFF29 inset",
                }}
                onClick={() => {
                  openNotificationDrawer({ data: "success" });
                  props.onClose();
                  connect(
                    { wallet },
                    {
                      onSuccess: onConnect,
                    },
                  );
                }}
              >
                {wallet.name}
              </Button>
            ))}
          </div>
        </div>
      </BottomSheet>

      <NotificationModal
        isOpen={notificationIsOpen}
        onClose={() => {}}
        onButtonClick={modalContent?.onButtonClick}
        buttonLabel={modalContent?.buttonLabel}
        isLoading={connectingWallet}
        title={modalContent?.title}
        description={modalContent?.description}
        status={notificationModalStatus}
      />
    </>
  );
};

export default ConnectDrawer;
