"use client";

import { Button } from "@/components/ui/button";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import ConnectDrawer from "../home/components/connect-drawer";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NotificationModal from "@/components/general/modals/notify";
import {
  NotificationStatus,
  useNotificationsModal,
} from "@/lib/hooks/use-notifications-modal";
import BullzTextLogo from "@/components/svg/bullz-text.logo";
import Bullfy from "@/components/svg/bullfy";

declare global {
  interface Window {
    suiWallet?: any;
    SlushWallet?: { sui?: any };
    eternl?: any;
  }
}

type WalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
  status: "connecting" | "failed" | "success";
  onRetry: () => void;
  connectedAccount?: { address: string } | null;
};

const WalletModal = ({
  isOpen,
  onClose,
  status,
  onRetry,
  connectedAccount,
}: WalletModalProps) => {
  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case "connecting":
        return {
          icon: "⏳",
          title: "CONNECTING WALLET...",
          message: null,
          buttonText: "CANCEL",
          buttonAction: onClose,
          buttonStyle: "bg-orange-500 hover:bg-orange-600",
        };
      case "failed":
        return {
          icon: "❗",
          title: "FAILED",
          message:
            "WE COULDN'T CONNECT YOUR WALLET. TRY AGAIN OR USE A DIFFERENT WALLET",
          buttonText: "CLOSE",
          buttonAction: onClose,
          buttonStyle: "bg-orange-500 hover:bg-orange-600",
        };
      case "success":
        return {
          icon: "✓",
          title: "CONNECTED",
          message: "YOUR WALLET HAS BEEN CONNECTED. YOU CAN START PLAYING NOW.",
          buttonText: "CONTINUE",
          buttonAction: onClose,
          buttonStyle: "bg-orange-500 hover:bg-orange-600",
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-sm text-center border border-slate-600">
        <div className="flex justify-center mb-4">
          <Bullfy />
        </div>

        <div className="text-3xl mb-4">{content.icon}</div>

        <h3 className="text-white font-bold text-lg mb-4 offbit-font text-sm">
          {content.title}
        </h3>

        {content.message && (
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            {content.message}
          </p>
        )}

        {status === "success" && connectedAccount?.address && (
          <div className="mb-4 p-3 bg-slate-700 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Connected Account:</p>
            <p className="text-white text-xs font-mono break-all">
              {connectedAccount.address}
            </p>
          </div>
        )}

        <Button
          onClick={content.buttonAction}
          className={`w-full h-12 text-white font-bold text-sm rounded-lg transition-colors ${content.buttonStyle}`}
        >
          {content.buttonText}
        </Button>
      </div>
    </div>
  );
};

export default function LoginPage() {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const router = useRouter();

  const {
    isOpen: walletModalIsOpen,
    onClose: closeWalletModal,
    onOpen: openWalletModal,
    disclosedData: notificationModalStatus,
    updateData,
  } = useDisclosure<NotificationStatus>();
  // const [walletStatus, setWalletStatus] = useState<
  //   "connecting" | "failed" | "success"
  // >("connecting");
  const [suiWallet, setSuiWallet] = useState<any>(null);
  const [connectedAccount, setConnectedAccount] = useState<{
    address: string;
  } | null>(null);

  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== "undefined") {
        if (window.suiWallet) setSuiWallet(window.suiWallet);
        else if (window.SlushWallet?.sui) setSuiWallet(window.SlushWallet.sui);
        else if (window.eternl) setSuiWallet(window.eternl);
      }
    };

    checkWallet();
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSuiWalletConnect = async () => {
    // setWalletStatus("connecting");
    openWalletModal();

    try {
      const wallet =
        suiWallet ??
        window?.suiWallet ??
        window?.SlushWallet?.sui ??
        window?.eternl;

      if (!wallet) throw new Error("No SUI-compatible wallet found.");

      const response = await wallet.requestPermissions({
        permissions: ["viewAccount"],
      });

      if (response?.accounts?.length > 0) {
        const account = response.accounts[0];
        setConnectedAccount(account);
        // setWalletStatus("success");

        // Redirect to /squad after slight delay
        setTimeout(() => {
          closeWalletModal();
          router.push("/squad");
        }, 1500);
      } else {
        throw new Error("No accounts found.");
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      // setWalletStatus("failed");
    }
  };

  const handleSlushConnect = () => {
    // setWalletStatus("connecting");
    openWalletModal();

    // Simulated Slush Wallet connection
    setTimeout(() => {
      const success = true;
      if (success) {
        // setWalletStatus("success");
        setConnectedAccount({ address: "slush_demo_address" });

        setTimeout(() => {
          closeWalletModal();
          router.push("/squad");
        }, 1500);
      } else {
        updateData("error");
        // setWalletStatus("failed");
      }
    }, 2000);
  };

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
    status: notificationModalStatus,
  });

  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");

        .offbit-font {
          font-family: "Press Start 2P", monospace;
          text-rendering: pixelated;
          image-rendering: pixelated;
          -webkit-font-smoothing: none;
          // -moz-osx-font-smoothing: grayscale;
        }

        .bull-glow {
          filter: drop-shadow(0 0 20px rgba(255, 92, 22, 0.5));
        }
      `}</style>

      <div className="h-screen flex flex-col justify-center items-center ">
        <div className="flex flex-col max-w-[19.25rem]">
          <div className="flex-1 flex flex-col items-center justify-center w-full text-center">
            <Bullfy width={"6.75rem"} height={"6.75rem"} />

            <div className="text-4xl offbit-font text-white mb-10 tracking-wider mt-[1.5rem]">
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
        onButtonClick={modalContent?.onButtonClick}
        // @ts-expect-error - -
        buttonLabel={modalContent?.buttonLabel}
        status={notificationModalStatus}
        title={modalContent?.title}
        description={modalContent?.description}
      />
    </>
  );
}
