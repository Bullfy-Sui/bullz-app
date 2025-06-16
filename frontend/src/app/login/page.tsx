"use client";

import NotificationModal from "@/components/general/modals/notify";
import Bullfy from "@/components/svg/bullfy";
import BullzTextLogo from "@/components/svg/bullz-text.logo";
import { Button } from "@/components/ui/button";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import {
  NotificationStatus,
  useNotificationsModal,
} from "@/lib/hooks/use-notifications-modal";
import { useRouter } from "next/navigation";
import ConnectDrawer from "../home/components/connect-drawer";

// declare global {
//   interface Window {
//     suiWallet?: any;
//     SlushWallet?: { sui?: any };
//     eternl?: any;
//   }
// }

export default function LoginPage() {
  const { onClose, isOpen } = useDisclosure();
  const router = useRouter();

  const {
    isOpen: walletModalIsOpen,
    onClose: closeWalletModal,
    onOpen: openWalletModal,
    disclosedData: notificationModalStatus,
  } = useDisclosure<NotificationStatus>();
  // const [walletStatus, setWalletStatus] = useState<
  //   "connecting" | "failed" | "success"
  // >("connecting");
  // const [suiWallet, setSuiWallet] = useState<any>(null);
  // const [connectedAccount, setConnectedAccount] = useState<{
  //   address: string;
  // } | null>(null);

  // useEffect(() => {
  //   const checkWallet = () => {
  //     if (typeof window !== "undefined") {
  //       if (window.suiWallet) setSuiWallet(window.suiWallet);
  //       else if (window.SlushWallet?.sui) setSuiWallet(window.SlushWallet.sui);
  //       else if (window.eternl) setSuiWallet(window.eternl);
  //     }
  //   };

  //   checkWallet();
  //   const interval = setInterval(checkWallet, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  // const handleSuiWalletConnect = async () => {
  //   // setWalletStatus("connecting");
  //   openWalletModal();

  //   try {
  //     const wallet =
  //       suiWallet ??
  //       window?.suiWallet ??
  //       window?.SlushWallet?.sui ??
  //       window?.eternl;

  //     if (!wallet) throw new Error("No SUI-compatible wallet found.");

  //     const response = await wallet.requestPermissions({
  //       permissions: ["viewAccount"],
  //     });

  //     if (response?.accounts?.length > 0) {
  //       const account = response.accounts[0];
  //       setConnectedAccount(account);
  //       // setWalletStatus("success");

  //       // Redirect to /squad after slight delay
  //       setTimeout(() => {
  //         closeWalletModal();
  //         router.push("/squad");
  //       }, 1500);
  //     } else {
  //       throw new Error("No accounts found.");
  //     }
  //   } catch (error) {
  //     console.error("Wallet connection failed:", error);
  //     // setWalletStatus("failed");
  //   }
  // };

  // const handleSlushConnect = () => {
  //   // setWalletStatus("connecting");
  //   openWalletModal();

  //   // Simulated Slush Wallet connection
  //   setTimeout(() => {
  //     const success = true;
  //     if (success) {
  //       // setWalletStatus("success");
  //       setConnectedAccount({ address: "slush_demo_address" });

  //       setTimeout(() => {
  //         closeWalletModal();
  //         router.push("/squad");
  //       }, 1500);
  //     } else {
  //       updateData("error");
  //       // setWalletStatus("failed");
  //     }
  //   }, 2000);
  // };

  // const closeWalletModal = () => {
  //   closeWalletModal();
  //   setWalletStatus("connecting");
  // };

  const modalContent = useNotificationsModal({
    successContent: {
      title: "CONNECTED",
      description: "YOUR WALLET HAS BEEN CONNECTED. YOU CAN START PLAYING NOW.",
      buttonLabel: "CONTINUE",
      onButtonClick: () => {
        router.push("/squad");
        closeWalletModal();
      },
    },
    errorContent: {
      title: "FAILED",
      description:
        "WE COULDN’T CONNECT YOUR WALLET. TRY AGAIN OR USE A DIFFERENT WALLET",
      buttonLabel: "CLOSE",
      onButtonClick: () => closeWalletModal(),
    },
    loadingContent: { description: "Connecting wallet...", type: "loading" },
    // @ts-expect-error - -
    status: notificationModalStatus,
  });

  return (
    <>
      <div className="h-screen flex flex-col justify-center items-center ">
        <div className="flex flex-col max-w-[19.25rem]">
          <div className="flex-1 flex flex-col items-center justify-center w-full text-center">
            <Bullfy width={"6.75rem"} height={"6.75rem"} />

            <div className="text-4xl font-offbit text-white mb-10 tracking-wider mt-[1.5rem]">
              <BullzTextLogo />
            </div>

            <p className="text-font-subtext font-[700] text-[1.375rem] whitespace-nowrap  leading-[1.75rem] tracking-[0.04em] text-center ">
              CONNECT YOUR WALLET TO
              <br />
              START TRADING CRYPTO LIKE
              <br />A FANTASY MANAGER
            </p>
          </div>

          <div className="w-full space-y-4 mt-[2.5rem]">
            <Button
              onClick={() => openWalletModal({ data: "success" })}
              className="w-full"
              style={{ textShadow: "1px 1px 2px #661600, 0px 1px 1px #661600" }}
            >
              CONNECT SLUSH WALLET
            </Button>

            <Button
              // onClick={handleSuiWalletConnect}
              variant={"secondary"}
              className="w-full"
              style={{
                textShadow: "1px 1px 2px #1A1A1AB2, 0px 1px 1px #1A1A1AB2",
              }}
            >
              CONNECT SUI WALLET
            </Button>
          </div>
        </div>
      </div>

      <ConnectDrawer isOpen={isOpen} onClose={onClose} />

      <NotificationModal
        isOpen={walletModalIsOpen}
        onClose={closeWalletModal}
        // @ts-expect-error - -
        status={notificationModalStatus}
        // @ts-expect-error - -
        buttonLabel={modalContent?.buttonLabel}
        // @ts-expect-error - -
        title={modalContent?.title}
        // @ts-expect-error - -
        onButtonClick={modalContent?.onButtonClick}
        description={modalContent?.description}
      />
    </>
  );
}
