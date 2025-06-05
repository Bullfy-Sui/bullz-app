"use client";

import { Button } from "@/components/ui/button";

import Bullfy from "@/components/svg/bullfy";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import ConnectDrawer from "../home/components/connect-drawer";

// Criteria
// same bid price
// teams must not be same
// if same coins, different allocation of virtual money

export default function LoginPage() {
  const { onOpen, onClose, isOpen } = useDisclosure();

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

        <Button onClick={() => onOpen()} className="w-full cursor-pointer">
          Connect Wallet
        </Button>
      </div>

      <ConnectDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
}
