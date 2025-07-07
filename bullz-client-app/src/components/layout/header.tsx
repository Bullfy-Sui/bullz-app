import { useAppStore } from "@/lib/store/app-store";
import {
  useCurrentAccount,
  useDisconnectWallet,
  useSuiClient,
  useCurrentWallet,
} from "@mysten/dapp-kit";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import DefaultDp from "../svg/default-dp";
import SuiCoin from "../svg/sui-coin";
import BullTrophy from "../svg/bull-trophy";
import PlusCircle from "../icons/plus-circle.icon";
import { Button } from "../ui/button";
import SuiLogo from "../svg/sui.logo";

const Header = () => {
  const { address, setAddress } = useAppStore();
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const { currentWallet } = useCurrentWallet();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>("devnet");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect current network
  useEffect(() => {
    if (suiClient) {
      // Get the network from the client's connection URL
      const url = (suiClient as any).transport?.url || "";
      if (url.includes("testnet")) {
        setCurrentNetwork("testnet");
      } else if (url.includes("mainnet")) {
        setCurrentNetwork("mainnet");
      } else {
        setCurrentNetwork("devnet");
      }
    }
  }, [suiClient]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      const walletAddress = currentAccount?.address || address;
      if (!walletAddress || !suiClient) return;

      setIsLoadingBalance(true);
      try {
        const balanceResult = await suiClient.getBalance({
          owner: walletAddress,
        });

        // Convert MIST to SUI
        const suiBalance =
          Number(balanceResult.totalBalance) / Number(MIST_PER_SUI);
        setBalance(suiBalance.toFixed(2));
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance("0.00");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const intervalId = setInterval(fetchBalance, 10000);

    return () => clearInterval(intervalId);
  }, [currentAccount?.address, address, suiClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDisconnect = () => {
    disconnect(undefined, {
      onSuccess: () => {
        setAddress(""); // Clear address from app store
        setBalance("0.00"); // Reset balance
        setShowDropdown(false);
        navigate("/login"); // Navigate to login page
      },
      onError: (error) => {
        console.error("Failed to disconnect wallet:", error);
        setShowDropdown(false);
      },
    });
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 8) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case "mainnet":
        return "text-green-400";
      case "testnet":
        return "text-yellow-400";
      case "devnet":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  // Only show the user profile if wallet is connected
  const displayAddress = currentAccount?.address || address;
  if (!displayAddress) {
    return null; // Don't render header if no wallet is connected
  }

  return (
    <div className="flex fixed px-[1.5rem] py-[0.5rem] max-w-[26.875rem]  mx-auto w-full z-50 top-0 items-center bg-background justify-between  mb-[1.62875rem]">
      <div className="relative" ref={dropdownRef}>
        <button
          className="gap-[0.5rem] flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <DefaultDp className="size-[1.375rem] rounded-full" />
          <div className="flex flex-col items-start">
            <span className="font-[600] leading-[100%] text-sm w-[7.5625rem] truncate">
              {formatAddress(displayAddress)}
            </span>
            <span
              className={`text-[0.5rem] font-[500] ${getNetworkColor(currentNetwork)} leading-[100%] uppercase`}
            >
              {currentNetwork}
            </span>
          </div>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg min-w-[150px] z-60">
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-600">
                Network:{" "}
                <span className={getNetworkColor(currentNetwork)}>
                  {currentNetwork.toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded-md transition-colors font-[600]"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>

      <div className=" text-white flex items-center gap-[0.5rem]">
        <div
          style={{
            boxShadow:
              "0px -4px 0px 0px #0000003D inset, 0px 4px 0px 0px #FFFFFF29 inset",
          }}
          className="h-[2.25rem] gap-[0.25rem] w-max px-[0.75rem] bg-gray-800 flex items-center justify-center"
        >
          <SuiLogo className="w-[1.25rem] h-[1.25rem] rounded-full" />
          <span className="leading-[100%] tracking-[0.04em] font-[700] text-[1.0625rem]">
            {isLoadingBalance ? "..." : balance}
          </span>
        </div>

        <div
          style={{
            boxShadow:
              "0px -4px 0px 0px #0000003D inset, 0px 4px 0px 0px #FFFFFF29 inset",
          }}
          className="h-[2.25rem] w-max px-[0.75rem] bg-gray-800 flex items-center justify-center"
        >
          <BullTrophy />
          <span className="leading-[100%] tracking-[0.04em] font-[700] text-[1.0625rem]">
            4,123
          </span>
        </div>
      </div>
    </div>
  );
};

export default Header;
