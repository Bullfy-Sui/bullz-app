import { useRegister } from "@/app/login/api-services";
import NotificationModal from "@/components/general/modals/notify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useAppStore } from "@/lib/store/app-store";
import { useConnectWallet, useWallets } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface ConnectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
  const {
    onOpen: openNotificationDrawer,
    onClose: closeNotificationDrawer,
    isOpen: notificationIsOpen,
  } = useDisclosure();

  const modalContent = useMemo(() => {
    if (registrationSuccess || connectionSuccess) {
      return {
        title: "Connection Successful",
        description: "You have successfully connected your wallet",
        buttonLabel: "Proceed home",
        type: "success",
      };
    }
    if (registrationError || connectionError) {
      return {
        title: "Error connecting wallet",
        description: "Sorry, we couldn’t connect your wallet",
        buttonLabel: "Try Again",
        type: "error",
      };
    }
  }, [
    registrationSuccess,
    connectionSuccess,
    registrationError,
    connectionError,
  ]);

  const onConnect = (res) => {
    console.log(res);
    console.log("connected");
    setAddress(res.accounts[0].address);
    router.push("/squad");
    // registerUser(
    //   {
    //     address: res.accounts[0].address,
    //   },
    //   {
    //     onSuccess: (data) => {
    //       setAddress(data.data.address);
    //       router.push("/squad");
    //     },
    //   }
    // );
  };

  return (
    <>
      <Dialog onOpenChange={props.onClose} open={props.isOpen}>
        <DialogContent className="max-w-[382px] bg-modal-bg rounded-[1.25rem] border-none w-[23.875rem] ">
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                className="w-full text-center border bg-transparent rounded-[1.25rem] border-waitlist-form-border"
                onClick={() => {
                  openNotificationDrawer();
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
        isOpen={notificationIsOpen}
        onClose={closeNotificationDrawer}
        onButtonClick={closeNotificationDrawer}
        buttonLabel={modalContent?.buttonLabel}
        // @ts-expect-error - -
        type={modalContent?.type}
        isLoading={registering || connectingWallet}
        title={modalContent?.title}
        // @ts-expect-error - -
        description={modalContent?.description}
      />
    </>
  );
};

export default ConnectDrawer;
