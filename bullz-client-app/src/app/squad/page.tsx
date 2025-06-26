"use client";

import CreateBullModal from "@/components/general/modals/create-bull-modal";
import NotificationModal from "@/components/general/modals/notify";
import PriceList from "@/components/general/token/price-list";
import NavWrapper from "@/components/layout/nav-wrapper";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { NotificationStatus } from "@/lib/hooks/use-notifications-modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddNewSquadButton from "./components/add-new-squad-button";

const SquadPage = () => {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const {
    onOpen: openNotification,
    isOpen: notificationIsOpen,
    onClose: closeNotification,
    disclosedData: notificationStatus,
  } = useDisclosure<NotificationStatus>();
  const [isCreating] = useState(false);
  const router = useRouter();
  const {
    isOpen: guideIsOpen,
    onClose: closeGuide,
    onOpen: openGuide,
  } = useDisclosure();

  // Simulate checking wallet balance (you can replace this with actual wallet integration)
  const checkWalletBalance = () => {
    // Simulate insufficient balance - you can replace this with actual balance check
    const hasInsufficientBalance = Math.random() > 0.5; // 50% chance for demo
    return hasInsufficientBalance;
  };

  const handleAddButtonClick = () => {
    onClose();
    if (checkWalletBalance()) {
      openNotification({ data: "error" });
    } else {
      openNotification({ data: "success" });
    }
  };

  useEffect(() => {
    if (window && !localStorage.getItem("understood-how-to-play")) {
      openGuide();
    }
  }, []);

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
            className="bg-gray-850 h-[9.5rem] w-full p-[1.5rem] py-0 flex flex-col justify-center"
          >
            <span className="text-gray-300 font-[700] block text-[0.875rem] leading-[100%] mb-[0.5rem]">
              YOUR BULLZ
            </span>
            <div className="flex items-center">
              <AddNewSquadButton onClick={onOpen} />
            </div>
          </div>
        </div>

        <CreateBullModal
          isOpen={isOpen}
          onClose={onClose}
          onCreate={handleAddButtonClick}
          cost={1}
          isCreating={isCreating}
        />

        <NotificationModal
          status="info"
          title="HOW TO PLAY"
          description="Pick tokens to build your Bull and lock horns with other players. The BULL with the better token difference wins. START BY ADDING A BULL BELOW."
          buttonLabel="I UNDERSTAND"
          onButtonClick={() => {
            closeGuide();
            localStorage.setItem("understood-how-to-play", "true");
          }}
          isOpen={guideIsOpen}
          onClose={closeGuide}
        />

        <NotificationModal
          // @ts-expect-error - -
          status={notificationStatus}
          title={
            notificationStatus === "success"
              ? "BULL CREATED"
              : "INSUFFICIENT BALANCE"
          }
          description={
            notificationStatus === "success"
              ? "NOW CHOOSE TOKENS TO MAKE UP YOUR BULL, THEN LOCK HORNS WITH OTHER PLAYERS TO START WINNING"
              : "YOU NEED AT LEAST 1 SUI IN YOUR WALLET TO CREATE A BULL. FUND YOUR WALLET AND TRY AGAIN"
          }
          onClose={() => closeNotification()}
          buttonLabel={notificationStatus === "success" ? "LET'S GO!" : "CLOSE"}
          onButtonClick={() => {
            closeNotification();
            if (notificationStatus === "success") router.push("/squad/new");
          }}
          isOpen={notificationIsOpen}
        />
      </>
    </NavWrapper>
  );
};

export default SquadPage;
