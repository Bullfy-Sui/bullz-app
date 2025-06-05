"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl("devnet") },
  // mainnet: { url: getFullnodeUrl("mainnet") },
});

const RootProvider = (props: { children: React.ReactNode }) => {
  const { children } = props;
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider slushWallet={{ name: "bullfy" }}>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};

export default RootProvider;
