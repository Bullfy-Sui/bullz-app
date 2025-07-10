import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { useState } from "react";
import { Counter } from "./Counter";
import { CreateCounter } from "./CreateCounter";
import { TokenPriceDisplay } from "./components/general/TokenPriceDisplay";

function App() {
  const currentAccount = useCurrentAccount();
  const [counterId, setCounter] = useState(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

  return (
    <>
      <div className="sticky top-0 px-4 py-2 flex justify-between border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold">dApp Starter Template</h1>
        </div>

        <div>
          <ConnectButton />
        </div>
      </div>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5 pt-2 px-4">
          {/* Token Prices Section */}
          <div>
            <TokenPriceDisplay />
          </div>
          
          {/* Counter Section */}
          <div className="min-h-[500px] bg-gray-600 p-4 rounded-lg">
            {currentAccount ? (
              counterId ? (
                <Counter id={counterId} />
              ) : (
                <CreateCounter
                  onCreated={(id) => {
                    window.location.hash = id;
                    setCounter(id);
                  }}
                />
              )
            ) : (
              <h1 className="text-2xl font-bold text-white">Please connect your wallet</h1>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
