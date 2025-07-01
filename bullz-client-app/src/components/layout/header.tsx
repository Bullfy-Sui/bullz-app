import { useAppStore } from "@/lib/store/app-store";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import DefaultDp from "../svg/default-dp";
import SuiCoin from "../svg/sui-coin";
import BullTrophy from "../svg/bull-trophy";
import PlusCircle from "../icons/plus-circle.icon";

const Header = () => {
  const { address, setAddress } = useAppStore();
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDisconnect = () => {
    disconnect(
      undefined,
      {
        onSuccess: () => {
          setAddress(""); // Clear address from app store
          setShowDropdown(false);
          navigate("/login"); // Navigate to login page
        },
        onError: (error) => {
          console.error("Failed to disconnect wallet:", error);
          setShowDropdown(false);
        },
      }
    );
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 8) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
          <span className="font-[600] leading-[100%] text-sm w-[7.5625rem] truncate">
            {formatAddress(displayAddress)}
          </span>
        </button>
        
        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg min-w-[150px] z-60">
            <div className="p-2">
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
      
      <div className="bg-[#141A28] rounded-l-[0.316875rem] text-white flex items-center">
        <div className="flex items-center">
          <SuiCoin />
          <span className="leading-[150%] font-[600] text-[0.60625rem] ">
            4.12
          </span>
        </div>
        <div className="flex items-center">
          <BullTrophy />
          <span className="leading-[150%] font-[600] text-[0.60625rem] ">
            4,123
          </span>
        </div>
        <div className="bg-gray-700 p-[0.316875rem] rounded-r-[0.316875rem] mr-[0.1875rem]">
          <PlusCircle />
        </div>
      </div>
    </div>
  );
};

export default Header;
