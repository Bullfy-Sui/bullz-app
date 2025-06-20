"use client";

import Bullfy from "@/components/svg/bullfy";
import BullzTextLogo from "@/components/svg/bullz-text.logo";
import { Button } from "@/components/ui/button";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useRouter } from "next/navigation";
import ConnectDrawer from "../home/components/connect-drawer";

export default function LoginPage() {
  const {
    onClose: closeConnectDrawer,
    isOpen: connectDrawerIsOpen,
    onOpen: openConnectDrawer,
  } = useDisclosure();
  const router = useRouter();

  // const {
  //   isOpen: walletModalIsOpen,
  //   onClose: closeWalletModal,
  //   onOpen: openWalletModal,
  //   disclosedData: notificationModalStatus,
  // } = useDisclosure<NotificationStatus>();
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

  // const closeWalletModal = () => {
  //   closeWalletModal();
  //   setWalletStatus("connecting");
  // };

  return (
    <>
      <div className="h-screen flex flex-col justify-center items-center ">
        <div className="flex flex-col max-w-[19.25rem] ">
          <div className="flex-1 flex flex-col items-center justify-center w-full text-center">
            <Bullfy width={"6.75rem"} height={"6.75rem"} />

            <div className="text-4xl font-offbit text-white mb-10 tracking-wider mt-[1.5rem]">
              <BullzTextLogo />
            </div>

            <p className="text-gray-300 font-[700] text-[1.375rem] whitespace-nowrap  leading-[1.75rem] tracking-[0.04em] text-center ">
              CONNECT YOUR WALLET TO
              <br />
              START TRADING CRYPTO LIKE
              <br />A FANTASY MANAGER
            </p>
          </div>

          <div className="w-full space-y-4 mt-[2.5rem]">
            <Button
              // onClick={() => openWalletModal({ data: "success" })}
              onClick={() => openConnectDrawer()}
              className="w-full"
              style={{ textShadow: "1px 1px 2px #661600, 0px 1px 1px #661600" }}
            >
              CONNECT WALLET
            </Button>

            {/* <Button
              // onClick={handleSuiWalletConnect}
              variant={"secondary"}
              className="w-full"
              style={{
                textShadow: "1px 1px 2px #1A1A1AB2, 0px 1px 1px #1A1A1AB2",
              }}
            >
              CONNECT SUI WALLET
            </Button> */}
          </div>
        </div>
      </div>

      <ConnectDrawer
        isOpen={connectDrawerIsOpen}
        onClose={closeConnectDrawer}
      />
      {/* 
      <NotificationModal
        isOpen={walletModalIsOpen}
        onClose={closeWalletModal}
        status={notificationModalStatus}
        buttonLabel={modalContent?.buttonLabel}
        title={modalContent?.title}
        onButtonClick={modalContent?.onButtonClick}
        description={modalContent?.description}
      /> */}
    </>
  );
}
