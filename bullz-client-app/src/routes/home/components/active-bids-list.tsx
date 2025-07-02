"use client";

import { Button } from "@/components/ui/button";
import { useCancelBid } from "@/lib/hooks/use-squad-contract";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useState, useEffect } from "react";

interface ActiveBid {
  id: string;
  squadId: number;
  bidAmount: number;
  duration: number;
  createdAt: number;
  status: string;
  creator: string;
}

interface ActiveBidsListProps {
  userBids: ActiveBid[];
  isLoading: boolean;
}

const ActiveBidsList = ({ userBids, isLoading }: ActiveBidsListProps) => {
  const cancelBid = useCancelBid();
  const [waitTimes, setWaitTimes] = useState<{ [bidId: string]: number }>({});

  // Update wait times every second
  useEffect(() => {
    if (!userBids || userBids.length === 0) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const newWaitTimes: { [bidId: string]: number } = {};
      
      userBids.forEach((bid) => {
        const bidCreatedTime = Number(bid.createdAt);
        const elapsed = Math.floor((currentTime - bidCreatedTime) / 1000);
        newWaitTimes[bid.id] = elapsed;
      });
      
      setWaitTimes(newWaitTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [userBids]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelBid = async (bidId: string) => {
    try {
      console.log("Cancelling bid:", bidId);
      await cancelBid.mutateAsync({ bidId });
    } catch (error) {
      console.error("Failed to cancel bid:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="font-offbit text-gray-400">Loading active bids...</p>
      </div>
    );
  }

  if (!userBids || userBids.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-offbit text-gray-400 text-[1rem]">
          No active bids. Create a bid to start looking for opponents!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-offbit text-white text-[1.375rem] font-[700] leading-[100%] tracking-[0.04em] text-center mb-4">
        ACTIVE BIDS
      </h2>
      
      {userBids.map((bid) => {
        const waitTime = waitTimes[bid.id] || 0;
        const showTimeoutOption = waitTime > 120; // 2 minutes
        
        return (
          <div
            key={bid.id}
            className="bg-gray-850 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-offbit text-white text-[1rem] font-[700]">
                  Squad #{bid.squadId}
                </p>
                <p className="font-offbit text-gray-300 text-[0.875rem]">
                  {Number(bid.bidAmount) / Number(MIST_PER_SUI)} SUI
                </p>
              </div>
              <div className="text-right">
                <p className="font-offbit text-gray-400 text-[0.75rem]">
                  Wait Time: {formatTime(waitTime)}
                </p>
                {showTimeoutOption && (
                  <p className="font-offbit text-yellow-400 text-[0.625rem] mt-1">
                    Taking too long?
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="font-offbit text-gray-400 text-[0.75rem]">
                Status: Looking for opponent...
              </p>
              <Button
                size="sm"
                variant={showTimeoutOption ? "destructive" : "secondary"}
                onClick={() => handleCancelBid(bid.id)}
                disabled={cancelBid.isPending}
                className="font-offbit text-[0.75rem]"
              >
                {cancelBid.isPending ? "CANCELLING..." : "CANCEL"}
              </Button>
            </div>
            
            {showTimeoutOption && (
              <p className="font-offbit text-gray-400 text-[0.625rem] mt-2 text-center">
                You'll get your full bid amount back including fees!
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ActiveBidsList; 