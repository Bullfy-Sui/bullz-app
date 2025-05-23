"use client";

import PriceList from "@/components/general/token/price-list";
import Header from "@/components/layout/header";
import AddNewSquadButton from "./components/add-new-squad-button";
import NotificationModal from "@/components/general/modals/notify";
import { useDisclosure } from "@/lib/hooks/use-diclosure";
import { useRouter } from "next/navigation";

const SquadPage = () => {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const router = useRouter();
  return (
    <>
      <Header />
      <div className="h-[60dvh] overflow-y-scroll">
        <PriceList />
      </div>

      <div className="bg-[#1E1E28] p-[1.5rem] border-t-[0.4px] border-white mt-1">
        <div className="flex items-center">
          <AddNewSquadButton onClick={onOpen} />
        </div>
      </div>
      <NotificationModal
        title="This will cost you 1 Sui"
        description="To create a team you need to have 1 sui"
        buttonLabel="Proceed"
        isLoading={false}
        isOpen={isOpen}
        onButtonClick={() => {
          router.push("/squad/new");
        }}
        onClose={onClose}
        type="warning"
      />
    </>
  );
};

export default SquadPage;
