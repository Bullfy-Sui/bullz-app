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

declare global {
  interface Window {
    suiWallet?: any;
    SlushWallet?: { sui?: any };
    eternl?: any;
  }
}

// Bull Head SVG Component
const BullHeadIcon = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 109 109"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M26.6348 79.4586V91.9473L38.7804 99.0269H68.7874L81.965 91.9473V77.8677H26.6348V79.4586Z"
      fill="#C83B07"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.6338 34.2763H49.7355C49.8149 35.6286 49.5767 37.299 49.8943 38.5718C50.5294 38.3331 58.1502 38.4127 58.8646 38.5718L58.944 34.1967H86.887C83.1559 28.8671 79.3455 23.458 75.6145 18.1284H33.1444L21.6338 34.2763Z"
      fill="#FF5C16"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M36.3202 85.5036L36.0026 59.0943L38.5429 56.4692H22.7456L20.6816 54.7192V77.549L36.3202 85.5036Z"
      fill="#FF5C16"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M81.3291 26.7996L86.8066 34.2769L88.9499 34.3564V38.4133L103.398 27.595L103.318 12.4813L86.6478 0.628906L92.4428 17.6518L81.3291 26.7996Z"
      fill="#FF8D5D"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M88.9512 38.413V51.0608C90.3007 50.9812 95.6988 51.0608 97.1277 51.0608L108.4 38.1743L88.9512 38.413Z"
      fill="#661800"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M34.2559 108.494L49.8944 102.051L49.815 97.0396C44.8139 94.8123 39.4952 92.9032 34.3352 90.835L34.2559 108.494ZM74.3445 108.494L58.7853 102.051L58.8647 97.0396C63.8659 94.8123 69.1846 92.9032 74.3445 90.835V108.494Z"
      fill="#FF8D5D"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M49.8941 52.6516H58.7851V43.2651L49.7354 43.5038L49.8941 52.6516Z"
      fill="#FF5C16"
    />
    <path
      d="M59.1025 94.7324H49.4971V104.357H59.1025V94.7324Z"
      fill="#FCAD72"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M72.7568 84.5492L71.8042 58.6172L69.1846 55.9127H85.7757L87.8397 54.2422L87.9191 77.0719L72.7568 84.5492Z"
      fill="#FF5C16"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M42.1939 52.6528H66.4852L72.6771 59.4938V85.1872L67.7553 88.6077H41.0031L36.002 85.1872V59.0961L42.1939 52.6528ZM65.0563 70.3916L62.1191 73.0962H46.2424L43.2258 70.3916H39.8917V73.0962V73.8121L44.2578 77.7894H64.1037L68.8667 73.4144V73.0962V70.3916H65.0563Z"
      fill="#FF8D5D"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M42.8281 65.3794L48.7025 65.2999V58.2998H42.8281V65.3794Z"
      fill="#0E0B02"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M60.0547 65.2998C61.2454 65.2203 64.8971 65.1407 65.9291 65.3794C65.6909 64.4248 65.7703 59.493 65.8497 58.2998L60.0547 58.2202V65.2998Z"
      fill="#0E0B02"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M34.3345 40.4012H40.6851L40.7645 47.9581H34.2551L34.3345 40.4012ZM24.3322 52.0149C26.8724 51.9354 41.1614 51.8558 42.8285 52.0945C43.2254 51.2195 45.6069 49.549 45.6863 48.8331C45.7657 48.2763 45.5275 40.6398 45.7657 38.333L24.3322 38.4126C24.2528 38.333 24.3322 52.0149 24.3322 52.0149Z"
      fill="#FCBC8B"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M74.344 40.4012H67.9933L67.914 47.9581H74.4234L74.344 40.4012ZM84.3463 52.0149C81.8061 51.9354 67.517 51.8558 65.9294 52.0945C65.5325 51.2195 63.151 49.549 63.0716 48.8331C62.9922 48.2763 63.2303 40.6398 62.9922 38.333L84.4257 38.4126L84.3463 52.0149Z"
      fill="#FCBC8B"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M27.1106 26.7996L21.6331 34.2769L19.4898 34.3564V38.4133L5.04199 27.595L5.12138 12.4813L21.7919 0.628906L15.9969 17.6518L27.1106 26.7996Z"
      fill="#FF8D5D"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.49 38.4134V51.0612C18.1404 50.9817 12.7424 51.0612 11.3135 51.0612L0.0410156 38.0952L19.49 38.4134Z"
      fill="#661800"
    />
  </svg>
);

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
          <BullHeadIcon />
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
            <div className="mb-8 bull-glow">
              <BullHeadIcon />
            </div>

            <h1 className="text-4xl offbit-font text-white mb-10 tracking-wider">
              BULLZ
            </h1>

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
