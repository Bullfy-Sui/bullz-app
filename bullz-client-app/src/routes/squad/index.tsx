import CreateBullModal from "@/components/general/modals/create-bull-modal";
import NotificationModal from "@/components/general/modals/notify";
import PriceList from "@/components/general/token/price-list";
import NavWrapper from "@/components/layout/nav-wrapper";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { NotificationStatus } from "@/lib/hooks/use-notifications-modal";
import { useGetSquadCreationFee, useCanCreateSquad, useGetUserSquads } from "@/lib/hooks/use-squad-contract";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AddNewSquadButton from "./components/add-new-squad-button";
import SquadItem from "./components/squad-item";
import { SquadResponseItem } from "./api-services/types";

const SquadPage = () => {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const {
    onOpen: openNotification,
    isOpen: notificationIsOpen,
    onClose: closeNotification,
    disclosedData: notificationStatus,
  } = useDisclosure<NotificationStatus>();
  const [isCreating] = useState(false);
  const [selectedSquadId, setSelectedSquadId] = useState<number | null>(null);
  const navigate = useNavigate();
  const {
    isOpen: guideIsOpen,
    onClose: closeGuide,
    onOpen: openGuide,
  } = useDisclosure();

  // Wallet connection
  const currentAccount = useCurrentAccount();

  // Smart contract hooks
  const { data: feeData, isLoading: isLoadingFee } = useGetSquadCreationFee();
  const { data: canCreate, isLoading: isCheckingBalance } = useCanCreateSquad();
  const { data: userSquads, isLoading: isLoadingSquads, error: squadsError } = useGetUserSquads();

  // Convert SquadData to SquadResponseItem format for UI compatibility
  const convertedSquads: SquadResponseItem[] = userSquads?.map(squad => ({
    squad: {
      id: squad.squad_id.toString(),
      name: squad.name,
      owner_id: squad.owner,
      wallet_address: squad.owner,
      formation: "4-3-3", // Default formation
      total_value: 0, // Default value
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    players: squad.players.map((playerName, index) => ({
      id: `${squad.squad_id}-${index}`,
      name: playerName,
      position: index + 1,
      squad_id: squad.squad_id.toString(),
      token_price_id: playerName,
      multiplier: 1,
    }))
  })) || [];

  const handleAddButtonClick = () => {
    onClose();
    if (!canCreate) {
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

  // Show loading state while checking fee or balance
  const isLoading = isLoadingFee || isCheckingBalance;
  const displayFee = feeData ? feeData.feeInSui.toFixed(3) : "...";

  return (
    <NavWrapper>
      <>
        <div className="flex flex-col h-full justify-between relative">
          <div className="h-[70dvh] overflow-y-scroll px-[1.5rem]">
            <PriceList />
          </div>

          <div
            style={{
              boxShadow: "0px 4px 0px 0px #FFFFFF29 inset",
            }}
            className="bg-gray-850 min-h-[9.5rem] w-full p-[1.5rem] py-0 flex flex-col justify-center"
          >
            <span className="text-gray-300 font-[700] block text-[0.875rem] leading-[100%] mb-[0.5rem]">
              YOUR BULLZ
            </span>
            
            {isLoadingSquads ? (
              <div className="flex items-center">
                <span className="text-gray-400 text-sm">Loading squads...</span>
              </div>
            ) : squadsError ? (
              <div className="flex items-center">
                <span className="text-red-400 text-sm">Error loading squads</span>
              </div>
            ) : convertedSquads.length > 0 ? (
              <div className="flex items-center gap-[0.5rem] overflow-x-auto">
                <div className="flex items-center gap-[0.5rem]">
                  {convertedSquads.map((squad) => (
                    <SquadItem
                      key={squad.squad.id}
                      onClick={() => setSelectedSquadId(Number(squad.squad.id))}
                      team={squad}
                      selected={selectedSquadId === Number(squad.squad.id)}
                    />
                  ))}
                </div>
                <AddNewSquadButton onClick={onOpen} disabled={isLoading} />
              </div>
            ) : (
              <div className="flex items-center">
                <AddNewSquadButton onClick={onOpen} disabled={isLoading} />
              </div>
            )}
          </div>
        </div>

        <CreateBullModal
          isOpen={isOpen}
          onClose={onClose}
          onCreate={handleAddButtonClick}
          cost={parseFloat(displayFee)}
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
              : `YOU NEED AT LEAST ${displayFee} SUI IN YOUR WALLET TO CREATE A BULL. FUND YOUR WALLET AND TRY AGAIN`
          }
          onClose={() => closeNotification()}
          buttonLabel={notificationStatus === "success" ? "LET'S GO!" : "CLOSE"}
          onButtonClick={() => {
            closeNotification();
            if (notificationStatus === "success") navigate("/squad/new");
          }}
          isOpen={notificationIsOpen}
        />
      </>
    </NavWrapper>
  );
};

export default SquadPage;
