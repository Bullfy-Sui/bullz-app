"use client";

import PriceList from "@/components/general/token/price-list";
import Header from "@/components/layout/header";
import AddNewSquadButton from "./components/add-new-squad-button";
import NotificationModal from "@/components/general/modals/notify";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SquadPage = () => {
  const { onOpen, onClose, isOpen } = useDisclosure(); // controls CREATE A BULL modal
  const [showInfo, setShowInfo] = useState(false); // controls HOW TO PLAY modal
  const [showInsufficientBalanceError, setShowInsufficientBalanceError] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setShowInfo(true); // Show "HOW TO PLAY" on first load
  }, []);

  // Simulate the "Create Bull" action with balance check i .e., if the user has enough balance to create a bull
  // In the  application, please  replace this with actual logic to that checks the user's balance
  const handleCreateBull = () => {
    const hasEnoughBalance = false; // Replace with your real balance check logic

    if (!hasEnoughBalance) {
      setShowInsufficientBalanceError(true);
    } else {
      setShowSuccessModal(true);
    }
    onClose(); // close the CREATE A BULL modal
  };

  return (
    <>
      <Header />

      <div className="h-[60dvh] overflow-y-scroll">
        <PriceList />
      </div>

      <div className="bg-[#1E1E28] p-[1.5rem] border-t-[0.4px] border-white mt-1">
        <div className="flex items-center">
          <AddNewSquadButton
            onClick={() => {
              if (!showInfo) onOpen(); // Prevent opening if HOW TO PLAY is still visible then open CREATE A BULL 
            }}
          />
        </div>
      </div>

      {/* CREATE A BULL Modal */}
      <NotificationModal
        title="CREATE A BULL"
        description="CREATING A BULL WILL COST YOU 1 SUI"
        buttonLabel="CREATE BULL"
        secondaryButtonLabel="CANCEL"
        isLoading={false}
        isOpen={isOpen}
        type="warning"
        onButtonClick={handleCreateBull}
        onSecondaryButtonClick={onClose}
        onClose={onClose}
      />

      {/* Insufficient Balance Error Modal */}
      <NotificationModal
        title="Insufficient Balance"
        description="You NEED AT LEAST 1 SUI IN YOUR WALLET TO CREATE A TEAM. FUND YOUR WALLET AND TRY AGAIN."
        buttonLabel="CLOSE"
        isLoading={false}
        isOpen={showInsufficientBalanceError}
        type="error"
        onButtonClick={() => setShowInsufficientBalanceError(false)}
        onClose={() => setShowInsufficientBalanceError(false)}
      />

      {/* Success Modal */}
      <NotificationModal
        title="BULL CREATED"
        description="NOW CHOOSE YOUR TOKENS TO MAKE UP YOUR BULL. THEN LOCK HORNS WITH OTHER PLAYERS TO START WINNING."
        buttonLabel="LET'S GO"
        isLoading={false}
        isOpen={showSuccessModal}
        type="success"
        onButtonClick={() => {
          setShowSuccessModal(false);
          router.push("/squad/new");
        }}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* HOW TO PLAY Modal */}
      <NotificationModal
        title="HOW TO PLAY"
        description="PICK TOKENS TO BUILD YOUR BULL AND LOCK HORNS WITH OTHER PLAYERS. THE BULL WITH THE BETTER TOKEN DIFFERENCE WINS. START BY ADDING A BULL BELOW."
        buttonLabel="I UNDERSTAND"
        isLoading={false}
        isOpen={showInfo}
        onButtonClick={() => {
          setShowInfo(false); // Close HOW TO PLAY
          onOpen();           // Open CREATE A BULL
        }}
        onClose={() => setShowInfo(false)}
        type="success"
      />
    </>
  );
};

export default SquadPage;