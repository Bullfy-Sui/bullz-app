"use client";

import PriceList from "@/components/general/token/price-list";
import Header from "@/components/layout/header";
import AddNewSquadButton from "./components/add-new-squad-button";
import CreateBullModal from "@/components/general/modals/create-bull-modal";
import NotificationModal from "@/components/general/modals/notify";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SquadPage = () => {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showBullCreated, setShowBullCreated] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
    //joshua
  // Simulate checking wallet balance (you can replace this with actual wallet integration)
  const checkWalletBalance = () => {
    // Simulate insufficient balance - you can replace this with actual balance check
    const hasInsufficientBalance = Math.random() > 0.5; // 50% chance for demo
    return hasInsufficientBalance;
  };

  const handleAddButtonClick = () => {
    if (checkWalletBalance()) {
      setShowInsufficientBalance(true);
    } else {
      onOpen();
    }
  };

  const handleCreateBull = () => {
    setIsCreating(true);
    // Simulate async creation
    setTimeout(() => {
      setIsCreating(false);
      onClose();
      setShowBullCreated(true);
    }, 2000);
  };

  return (
    <>
      <Header />
      <div className="h-[60dvh] overflow-y-scroll">
        <PriceList />
      </div>

      <div className="bg-[#1E1E28] p-[1.5rem] border-t-[0.4px] border-white mt-1">
        <div className="flex items-center">
          <AddNewSquadButton onClick={handleAddButtonClick} />
        </div>
      </div>
      
      <CreateBullModal
        isOpen={isOpen}
        onClose={onClose}
        onCreate={handleCreateBull}
        cost={1}
        isCreating={isCreating}
      />
      
      <NotificationModal
        type="success"
        title="BULL CREATED"
        description="NOW CHOOSE TOKENS TO MAKE UP YOUR BULL, THEN LOCK HORNS WITH OTHER PLAYERS TO START WINNING"
        onClose={() => setShowBullCreated(false)}
        buttonLabel="LET'S GO!"
        onButtonClick={() => {
          setShowBullCreated(false);
          router.push("/squad/new");
        }}
        isOpen={showBullCreated}
        isLoading={false}
      />
      
      <NotificationModal
        type="error"
        title="INSUFFICIENT BALANCE"
        description="YOU NEED AT LEAST 1 SUI IN YOUR WALLET TO CREATE A BULL. FUND YOUR WALLET AND TRY AGAIN"
        onClose={() => setShowInsufficientBalance(false)}
        buttonLabel="CLOSE"
        onButtonClick={() => setShowInsufficientBalance(false)}
        isOpen={showInsufficientBalance}
        isLoading={false}
      />
    </>
  );
};

export default SquadPage;
