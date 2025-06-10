"use client";

import PriceList from "@/components/general/token/price-list";
import Header from "@/components/layout/header";
import AddNewSquadButton from "./components/add-new-squad-button";
import CreateBullModal from "@/components/general/modals/create-bull-modal";
import NotificationModal from "@/components/general/modals/notify";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NavBar from "@/components/layout/navbar";
import NavWrapper from "@/components/layout/nav-wrapper";

const SquadPage = () => {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showBullCreated, setShowBullCreated] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const {
    isOpen: guideIsOpen,
    onClose: closeGuide,
    onOpen: openGuide,
  } = useDisclosure();
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
    <NavWrapper>
      <>
        <div className="flex flex-col h-full justify-between relative pt-[4rem] ">
          <div className="h-[70dvh] overflow-y-scroll px-[1.5rem]">
            <PriceList />
          </div>

          <div
            style={{
              boxShadow: "0px 4px 0px 0px #FFFFFF29 inset",
            }}
            className="bg-gray-850 h-[9.5rem] w-full p-[1.5rem]"
          >
            <span className="text-modal-desc font-[700] block text-[0.875rem] leading-[100%] mb-[1rem]">
              YOUR BULLZ
            </span>
            <div className="flex items-center">
              <AddNewSquadButton onClick={handleAddButtonClick} />
            </div>
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
          status="info"
          title="HOW TO PLAY"
          description="Pick tokens to build your Bull and lock horns with other players. The BULL with the better token difference wins. START BY ADDING A BULL BELOW."
          buttonLabel="I UNDERSTAND"
          isOpen={guideIsOpen}
          onClose={closeGuide}
        />

        <NotificationModal
          status="success"
          title="BULL CREATED"
          description="NOW CHOOSE TOKENS TO MAKE UP YOUR BULL, THEN LOCK HORNS WITH OTHER PLAYERS TO START WINNING"
          onClose={() => setShowBullCreated(false)}
          buttonLabel="LET'S GO!"
          onButtonClick={() => {
            setShowBullCreated(false);
            router.push("/squad/new");
          }}
          isOpen={showBullCreated}
        />

        <NotificationModal
          status="error"
          title="INSUFFICIENT BALANCE"
          description="YOU NEED AT LEAST 1 SUI IN YOUR WALLET TO CREATE A BULL. FUND YOUR WALLET AND TRY AGAIN"
          onClose={() => setShowInsufficientBalance(false)}
          buttonLabel="CLOSE"
          onButtonClick={() => setShowInsufficientBalance(false)}
          isOpen={showInsufficientBalance}
        />
      </>
    </NavWrapper>
  );
};

export default SquadPage;
