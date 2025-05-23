"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { useConnectWallet, useWallets } from "@mysten/dapp-kit";

import { useRouter } from "next/navigation";
import { useRegister } from "./api-services";

import NotificationModal from "@/components/general/modals/notify";
import Bullfy from "@/components/svg/bullfy";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useMemo } from "react";

// Criteria
// same bid price
// teams must not be same
// if same coins, different allocation of virtual money

export default function LoginPage() {
  const wallets = useWallets();
  const {
    mutate: connect,
    isPending: connectingWallet,
    isSuccess: connectionSuccess,
    isError: connectionError,
  } = useConnectWallet();
  const { setAddress } = useAppStore();
  const router = useRouter();
  const {
    mutate: registerUser,
    isPending: registering,
    isSuccess: registrationSuccess,
    isError: registrationError,
  } = useRegister();
  const { onOpen, onClose, isOpen } = useDisclosure();

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

  // if (registering || connectingWallet) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <p className="text-muted">Authenticating...</p>
  //     </div>
  //   );
  // }

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
    registering,
    connectingWallet,
  ]);

  return (
    <>
      <div className="text-white h-[100dvh] flex flex-col items-center py-[4rem]">
        <div className="flex-1 flex flex-col items-center w-[19.25rem]">
          <Bullfy />

          <div>
            <h1 className="text-4xl font-bold text-center mb-[1.25rem]">
              Welcome to Bullfy
            </h1>

            <p className="text-center">
              Connect your wallet to start building your crypto fantasy squad.
            </p>
          </div>
        </div>

        {wallets.map((wallet) => (
          <Button
            key={wallet.name}
            className="w-full text-center"
            onClick={() => {
              onOpen();
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
      <NotificationModal
        isOpen={isOpen}
        onClose={onClose}
        onButtonClick={onClose}
        buttonLabel={modalContent?.buttonLabel}
        type={modalContent?.type}
        isLoading={registering || connectingWallet}
        title={modalContent?.title}
        description={modalContent?.description}
      />
    </>
  );
}
