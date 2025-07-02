import EmptyPlayerDp from "@/components/svg/empty-player-dp";
import UserPlayer from "@/components/svg/user-player";
import { Button } from "@/components/ui/button";
import { useGetUserBids, useCancelBid } from "@/lib/hooks/use-squad-contract";
import { useState, useEffect } from "react";
import { MIST_PER_SUI } from "@mysten/sui/utils";

interface Props {
  onCancel: () => void;
  squadId?: number;
}

const LockedHorns = (props: Props) => {
  const { data: userBids, refetch: refetchBids } = useGetUserBids();
  const cancelBid = useCancelBid();
  const [waitTime, setWaitTime] = useState(0);
  const [showTimeoutOption, setShowTimeoutOption] = useState(false);

  // Debug: Log all user bids and squad ID
  useEffect(() => {
    console.log("🔍 LockedHorns Debug:", {
      squadId: props.squadId,
      userBids: userBids,
      userBidsLength: userBids?.length || 0,
    });
  }, [userBids, props.squadId]);

  // Find active bid for the current squad (be more flexible with status)
  const activeBid = userBids?.find((bid: any) => {
    console.log("🔍 Checking bid:", bid, "against squadId:", props.squadId);
    return bid.squadId === props.squadId;
  });

  // If no active bid found for specific squad, get the most recent bid
  const fallbackBid = userBids && userBids.length > 0 ? userBids[0] : null;
  const currentBid = activeBid || fallbackBid;

  console.log("🎯 Current bid:", currentBid);

  // Update wait time every second
  useEffect(() => {
    if (!currentBid) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const bidCreatedTime = Number(currentBid.createdAt);
      const elapsed = Math.floor((currentTime - bidCreatedTime) / 1000);
      setWaitTime(elapsed);

      // Show timeout option after 2 minutes
      if (elapsed > 120) {
        setShowTimeoutOption(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelBid = async () => {
    console.log("🚀 Cancel button clicked!");
    
    // Try to cancel the specific bid first, then fallback
    const bidToCancel = currentBid;
    
    if (!bidToCancel) {
      console.error("No bid to cancel");
      // Still allow user to close the modal
      props.onCancel();
      return;
    }

    try {
      console.log("Cancelling bid:", bidToCancel.id);
      await cancelBid.mutateAsync({ bidId: bidToCancel.id });
      
      console.log("Bid cancelled successfully!");
      
      // Refetch bids to update the UI
      await refetchBids();
      
      // Close the modal
      props.onCancel();
    } catch (error) {
      console.error("Failed to cancel bid:", error);
      // Still allow user to close the modal even if cancel fails
      props.onCancel();
    }
  };

  return (
    <div>
      <p className="text-center text-gray-300 font-[700] font-offbit text-[1.0625rem] leading-[100%] tracking-[0.04em] my-[1rem]">
        {showTimeoutOption ? "TAKING TOO LONG?" : "LOOKING FOR SOMEONE..."}
      </p>
      
      {currentBid && (
        <div className="text-center mb-[1rem]">
          <p className="text-white font-offbit text-[0.875rem] mb-2">
            Bid Amount: {Number(currentBid.bidAmount) / Number(MIST_PER_SUI)} SUI
          </p>
          <p className="text-gray-400 font-offbit text-[0.875rem]">
            Wait Time: {formatTime(waitTime)}
          </p>
          {showTimeoutOption && (
            <p className="text-yellow-400 font-offbit text-[0.75rem] mt-2">
              No opponent found yet. You can cancel to get your funds back.
            </p>
          )}
        </div>
      )}

      {!currentBid && (
        <div className="text-center mb-[1rem]">
          <p className="text-gray-400 font-offbit text-[0.875rem]">
            No active bid found. You can still close this dialog.
          </p>
        </div>
      )}

      <div className="flex items-center gap-[0.5rem] w-max mx-auto mb-[1rem]">
        <div className="w-[7rem] flex flex-col gap-[0.5rem] items-center justify-center">
          <UserPlayer
            color="#C2FF5F"
            style={{
              boxShadow: "0px 8.07px 13.45px 0px #00000066",
            }}
          />
          <span className="font-[700] text-[1.0625rem] leading-[100%] tracking-[0.04em]">
            YOU
          </span>
        </div>
        <span className="font-[700] text-gray-300 font-offbit text-[1.0625rem]">
          VS
        </span>

        <div className="w-[7rem] flex flex-col items-center justify-center gap-[0.5rem]">
          <EmptyPlayerDp
            style={{
              boxShadow: "0px 8.07px 13.45px 0px #00000066",
            }}
          />
          <span className="font-[700] text-[1.0625rem] leading-[100%] tracking-[0.04em] text-gray-400 font-offbit">
            ???
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Button
          type="button"
          className="w-full text-[1.0625rem] cursor-pointer"
          variant={showTimeoutOption ? "destructive" : "secondary"}
          onClick={handleCancelBid}
          disabled={cancelBid.isPending}
        >
          {cancelBid.isPending 
            ? "CANCELLING..." 
            : currentBid 
              ? "CANCEL REQUEST" 
              : "CLOSE"
          }
        </Button>
        
        {showTimeoutOption && currentBid && (
          <p className="text-center text-[0.75rem] text-gray-400 font-offbit">
            Don't worry - you'll get your full bid amount back including fees!
          </p>
        )}
      </div>
    </div>
  );
};

export default LockedHorns;
