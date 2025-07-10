import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../../networkConfig";
import { MIST_PER_SUI } from "@mysten/sui/utils";

// Types for bid data based on contract structure
export interface UserBid {
  id: string;
  creator: string;
  squadId: number;
  bidAmount: number;
  duration: number;
  createdAt: number;
  status: "Open" | "Matched" | "Cancelled";
  escrowBalance: number;
  feeBalance: number;
}

// Types for match data
export interface UserMatch {
  id: string;
  bid1Id: string;
  bid2Id: string;
  player1: string;
  player2: string;
  squad1Id: number;
  squad2Id: number;
  totalPrize: number;
  totalFees: number;
  duration: number;
  startedAt: number;
  endsAt: number;
  status: "Active" | "Completed" | "Tied" | "Disputed";
  winner?: string;
  prizeClaimed: boolean;
}

// Hook for creating a new bid
export const useCreateBid = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const activeSquadRegistryId = useNetworkVariable("activeSquadRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["create-bid"],
    mutationFn: async ({
      squadId,
      bidAmount,
      duration,
    }: {
      squadId: number;
      bidAmount: number; // in MIST
      duration: number; // in milliseconds
    }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      console.log(`Creating bid for squad ${squadId} with amount ${bidAmount} MIST and duration ${duration}ms`);

      const tx = new Transaction();

      // Calculate the total payment needed (bid amount + fee)
      // Get fee using devInspectTransactionBlock
      const feeResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const inspectTx = new Transaction();
          inspectTx.moveCall({
            package: packageId,
            module: "fee_calculator",
            function: "calculate_upfront_fee",
            arguments: [
              inspectTx.pure.u64(bidAmount),
              inspectTx.object(feeConfigId),
            ],
          });
          return inspectTx;
        })(),
        sender: currentAccount.address,
      });

      // Parse fee from result or use fallback
      const feeAmount = 100000; // 0.0001 SUI as fallback fee
      const totalPayment = bidAmount + feeAmount;

      // Split coins for total payment (bid + fee)
      const [payment] = tx.splitCoins(tx.gas, [totalPayment]);

      // Call create_bid function
      tx.moveCall({
        package: packageId,
        module: "match_escrow",
        function: "create_bid",
        arguments: [
          tx.object(escrowRegistryId),
          tx.object(squadRegistryId),
          tx.object(activeSquadRegistryId),
          tx.object(feeConfigId),
          tx.pure.u64(squadId),
          tx.pure.u64(bidAmount),
          tx.pure.u64(duration),
          payment,
          tx.object("0x6"), // Clock object
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Bid created successfully:", result);
              queryClient.invalidateQueries({ queryKey: ["user-bids"] });
              queryClient.invalidateQueries({ queryKey: ["active-bids"] });
              resolve({
                result,
                squadId,
                bidAmount,
                duration,
              });
            },
            onError: (error) => {
              console.error("Failed to create bid:", error);
              reject(error);
            },
          }
        );
      });
    },
  });
};

// Hook for cancelling a bid
export const useCancelBid = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");
  const activeSquadRegistryId = useNetworkVariable("activeSquadRegistryId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["cancel-bid"],
    mutationFn: async ({ bidId }: { bidId: string }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      console.log(`Cancelling bid ${bidId}`);

      const tx = new Transaction();

      // Call cancel_bid function
      tx.moveCall({
        package: packageId,
        module: "match_escrow",
        function: "cancel_bid",
        arguments: [
          tx.object(escrowRegistryId),
          tx.object(activeSquadRegistryId),
          tx.pure.id(bidId),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Bid cancelled successfully:", result);
              queryClient.invalidateQueries({ queryKey: ["user-bids"] });
              queryClient.invalidateQueries({ queryKey: ["active-bids"] });
              resolve({
                result,
                bidId,
              });
            },
            onError: (error) => {
              console.error("Failed to cancel bid:", error);
              reject(error);
            },
          }
        );
      });
    },
  });
};

// Hook for claiming prize from a completed match
export const useClaimPrize = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");
  const feesId = useNetworkVariable("feesId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["claim-prize"],
    mutationFn: async ({ matchId }: { matchId: string }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      console.log(`Claiming prize for match ${matchId}`);

      const tx = new Transaction();

      // Call claim_prize function
      tx.moveCall({
        package: packageId,
        module: "match_escrow",
        function: "claim_prize",
        arguments: [
          tx.object(escrowRegistryId),
          tx.object(feesId),
          tx.pure.id(matchId),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Prize claimed successfully:", result);
              queryClient.invalidateQueries({ queryKey: ["user-matches"] });
              resolve({
                result,
                matchId,
              });
            },
            onError: (error) => {
              console.error("Failed to claim prize:", error);
              reject(error);
            },
          }
        );
      });
    },
  });
};

// Hook for fetching user's active bids
export const useGetUserBids = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");

  return useQuery({
    queryKey: ["user-bids", currentAccount?.address],
    queryFn: async (): Promise<UserBid[]> => {
      if (!currentAccount?.address) {
        return [];
      }

      try {
        console.log("Fetching user bids for:", currentAccount.address);

        // Query BidCreated events for this user
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${packageId}::match_escrow::BidCreated`,
          },
          limit: 50,
          order: "descending",
        });

        const userBids: UserBid[] = [];

        for (const event of events.data) {
          if (event.parsedJson) {
            const bidData = event.parsedJson as any;
            
            // Filter bids created by current user
            if (bidData.creator === currentAccount.address) {
              userBids.push({
                id: bidData.bid_id,
                creator: bidData.creator,
                squadId: parseInt(bidData.squad_id),
                bidAmount: parseInt(bidData.bid_amount),
                duration: parseInt(bidData.duration),
                createdAt: Date.now(), // Would need to get from event timestamp
                status: "Open", // Would need to check current status from contract
                escrowBalance: parseInt(bidData.bid_amount),
                feeBalance: 0, // Would need to get from contract
              });
            }
          }
        }

        console.log("Found user bids:", userBids);
        return userBids;

      } catch (error) {
        console.error("Error fetching user bids:", error);
        return [];
      }
    },
    enabled: !!currentAccount?.address,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Hook for fetching user's matches
export const useGetUserMatches = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  return useQuery({
    queryKey: ["user-matches", currentAccount?.address],
    queryFn: async (): Promise<UserMatch[]> => {
      if (!currentAccount?.address) {
        return [];
      }

      try {
        console.log("Fetching user matches for:", currentAccount.address);

        // Query BidsMatched events for this user
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${packageId}::match_escrow::BidsMatched`,
          },
          limit: 50,
          order: "descending",
        });

        const userMatches: UserMatch[] = [];

        for (const event of events.data) {
          if (event.parsedJson) {
            const matchData = event.parsedJson as any;
            
            // Filter matches where current user is player1 or player2
            if (matchData.player1 === currentAccount.address || matchData.player2 === currentAccount.address) {
              userMatches.push({
                id: matchData.match_id,
                bid1Id: matchData.bid1_id,
                bid2Id: matchData.bid2_id,
                player1: matchData.player1,
                player2: matchData.player2,
                squad1Id: parseInt(matchData.squad1_id),
                squad2Id: parseInt(matchData.squad2_id),
                totalPrize: parseInt(matchData.total_prize),
                totalFees: 0, // Would need to get from contract
                duration: parseInt(matchData.duration),
                startedAt: Date.now(), // Would need to get from event timestamp
                endsAt: parseInt(matchData.ends_at),
                status: "Active", // Would need to check current status from contract
                prizeClaimed: false, // Would need to get from contract
              });
            }
          }
        }

        console.log("Found user matches:", userMatches);
        return userMatches;

      } catch (error) {
        console.error("Error fetching user matches:", error);
        return [];
      }
    },
    enabled: !!currentAccount?.address,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Hook for fetching all active bids (for matching)
export const useGetActiveBids = () => {
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable("packageId");

  return useQuery({
    queryKey: ["active-bids"],
    queryFn: async (): Promise<UserBid[]> => {
      try {
        console.log("Fetching all active bids");

        // Query BidCreated events
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${packageId}::match_escrow::BidCreated`,
          },
          limit: 100,
          order: "descending",
        });

        const activeBids: UserBid[] = [];

        for (const event of events.data) {
          if (event.parsedJson) {
            const bidData = event.parsedJson as any;
            
            // Check if bid is still active (not cancelled or matched)
            // In a real implementation, you would query the contract to check current status
            activeBids.push({
              id: bidData.bid_id,
              creator: bidData.creator,
              squadId: parseInt(bidData.squad_id),
              bidAmount: parseInt(bidData.bid_amount),
              duration: parseInt(bidData.duration),
              createdAt: Date.now(), // Would need to get from event timestamp
              status: "Open", // Would need to check current status from contract
              escrowBalance: parseInt(bidData.bid_amount),
              feeBalance: 0, // Would need to get from contract
            });
          }
        }

        console.log("Found active bids:", activeBids);
        return activeBids;

      } catch (error) {
        console.error("Error fetching active bids:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Hook for checking if a bid can be cancelled
export const useCanCancelBid = (bidId: string) => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");

  return useQuery({
    queryKey: ["can-cancel-bid", bidId, currentAccount?.address],
    queryFn: async (): Promise<boolean> => {
      if (!currentAccount?.address || !bidId) {
        return false;
      }

      try {
        // In a real implementation, you would query the contract to check:
        // 1. If the bid exists
        // 2. If the current user is the creator
        // 3. If the bid status is "Open" (not matched or cancelled)
        
        // For now, return true as placeholder
        return true;

      } catch (error) {
        console.error("Error checking if can cancel bid:", error);
        return false;
      }
    },
    enabled: !!currentAccount?.address && !!bidId,
    refetchInterval: 60000, // Refetch every minute
  });
};

// Hook for checking if a match prize can be claimed
export const useCanClaimPrize = (matchId: string) => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  return useQuery({
    queryKey: ["can-claim-prize", matchId, currentAccount?.address],
    queryFn: async (): Promise<boolean> => {
      if (!currentAccount?.address || !matchId) {
        return false;
      }

      try {
        // In a real implementation, you would query the contract to check:
        // 1. If the match exists and is completed
        // 2. If the current user is the winner
        // 3. If the prize hasn't been claimed yet
        
        // For now, return false as placeholder
        return false;

      } catch (error) {
        console.error("Error checking if can claim prize:", error);
        return false;
      }
    },
    enabled: !!currentAccount?.address && !!matchId,
    refetchInterval: 60000, // Refetch every minute
  });
}; 