import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import "./fonts.css";
import "./globals.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { networkConfig } from "./networkConfig.ts";

import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.tsx";

const queryClient = new QueryClient();

// Automatically choose network based on environment
const getDefaultNetwork = (): "devnet" | "testnet" | "mainnet" => {
  // Check for explicit network environment variable
  const envNetwork = import.meta.env.VITE_NETWORK;
  if (envNetwork && ["devnet", "testnet", "mainnet"].includes(envNetwork)) {
    return envNetwork as "devnet" | "testnet" | "mainnet";
  }

  // Auto-detect based on environment
  if (import.meta.env.DEV) {
    // Development mode - use devnet
    return "devnet";
  } else if (import.meta.env.PROD) {
    // Production mode - check hostname or default to mainnet
    const hostname = window.location.hostname;
    
    if (hostname.includes("testnet") || hostname.includes("test")) {
      return "testnet";
    } else if (hostname.includes("devnet") || hostname.includes("dev")) {
      return "devnet";
    } else {
      return "mainnet"; // Production default
    }
  }

  // Fallback to devnet
  return "devnet";
};

const defaultNetwork = getDefaultNetwork();

console.log(`🌐 Auto-selected network: ${defaultNetwork}`);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
        <WalletProvider slushWallet={{ name: "bullz" }} autoConnect>
          <RouterProvider router={router} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
