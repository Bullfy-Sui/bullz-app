import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAppStore } from "@/lib/store/app-store";
import { useEffect } from "react";
import { useNavigate } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const currentAccount = useCurrentAccount();
  const { address } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If no wallet is connected and no address in store, redirect to login
    if (!currentAccount && !address) {
      navigate("/login", { replace: true });
    }
  }, [currentAccount, address, navigate]);

  // Show loading or return children if wallet is connected
  if (!currentAccount && !address) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-white">Checking wallet connection...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 