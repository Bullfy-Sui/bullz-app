import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { useState } from "react";
import { Counter } from "./Counter";
import { CreateCounter } from "./CreateCounter";

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
        <div className="mt-5 pt-2 px-4 min-h-[500px] bg-gray-600">
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
            <h1 className="text-2xl font-bold">Please connect your wallet</h1>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
