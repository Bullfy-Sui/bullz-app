import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNetworkVariable } from "@/networkConfig";
import { MIST_PER_SUI } from "@mysten/sui/utils";

export interface SquadData {
  squad_id: number;
  name: string;
  owner: string;
  players: string[];
  life: number;
  death_time?: number;
}

// Hook for creating a complete squad (create + add players) in a single PTB
export const useCreateCompleteSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");
  const feesId = useNetworkVariable("feesId");

  return useMutation({
    mutationKey: ["create-complete-squad"],
    mutationFn: async ({
      squadName,
      playerNames,
    }: {
      squadName: string;
      playerNames: string[];
    }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      if (playerNames.length !== 7) {
        throw new Error("Must provide exactly 7 players");
      }

      // Get squad creation fee and current squad registry state
      const [feeConfigObject, registryData] = await Promise.all([
        suiClient.getObject({
          id: feeConfigId,
          options: { showContent: true },
        }),
        suiClient.getObject({
          id: squadRegistryId,
          options: { showContent: true },
        })
      ]);

      if (!feeConfigObject.data?.content || feeConfigObject.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch fee configuration");
      }

      if (!registryData.data?.content || registryData.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch squad registry");
      }

      const feeConfig = feeConfigObject.data.content.fields as any;
      const creationFee = feeConfig.squad_creation_fee;

      const registryFields = registryData.data.content.fields as any;
      const nextSquadId = Number(registryFields.next_squad_id);

      console.log(`Creating squad with ID: ${nextSquadId}`);

      // Create single PTB with both operations
      const tx = new Transaction();

      // Split coins for payment
      const [payment] = tx.splitCoins(tx.gas, [creationFee]);

      // Step 1: Call create_squad function
      tx.moveCall({
        package: packageId,
        module: "squad_manager",
        function: "create_squad",
        arguments: [
          tx.object(squadRegistryId),
          tx.object(feeConfigId),
          tx.object(feesId),
          payment,
        ],
      });

      // Step 2: Call add_players_to_squad function in the same PTB
      // We use the squad ID that we know will be assigned (nextSquadId)
      tx.moveCall({
        package: packageId,
        module: "squad_manager",
        function: "add_players_to_squad",
        arguments: [
          tx.object(squadRegistryId),
          tx.pure.u64(nextSquadId),
          tx.pure.string(squadName),
          tx.pure.vector("string", playerNames),
        ],
      });

      // Execute the combined transaction
      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Complete squad created successfully:", result);
              resolve({
                result,
                squadId: nextSquadId,
              });
            },
            onError: (error) => {
              console.error("Failed to create complete squad:", error);
              reject(error);
            },
          }
        );
      });
    },
  });
};

// Hook for getting squad creation fee
export const useGetSquadCreationFee = () => {
  const suiClient = useSuiClient();
  const feeConfigId = useNetworkVariable("feeConfigId");

  return useQuery({
    queryKey: ["squad-creation-fee", feeConfigId],
    queryFn: async () => {
      const feeConfigObject = await suiClient.getObject({
        id: feeConfigId,
        options: { showContent: true },
      });

      if (!feeConfigObject.data?.content || feeConfigObject.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch fee configuration");
      }

      const feeConfig = feeConfigObject.data.content.fields as any;
      const creationFeeInMist = feeConfig.squad_creation_fee;
      
      // Convert MIST to SUI
      const creationFeeInSui = Number(creationFeeInMist) / Number(MIST_PER_SUI);
      
      return {
        feeInMist: creationFeeInMist,
        feeInSui: creationFeeInSui,
      };
    },
    enabled: !!feeConfigId,
  });
};

// Hook for getting user's squads
export const useGetUserSquads = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const squadRegistryId = useNetworkVariable("squadRegistryId");

  return useQuery({
    queryKey: ["user-squads", currentAccount?.address, squadRegistryId],
    queryFn: async (): Promise<SquadData[]> => {
      console.log("🔍 Fetching user squads...");
      
      if (!currentAccount?.address || !squadRegistryId) {
        console.log("❌ Missing account or registry ID");
        return [];
      }

      try {
        // Get squad registry object to get table IDs
        const squadRegistryObject = await suiClient.getObject({
          id: squadRegistryId,
          options: { showContent: true },
        });

        if (!squadRegistryObject.data?.content || squadRegistryObject.data.content.dataType !== "moveObject") {
          console.log("❌ Failed to fetch squad registry");
          return [];
        }

        const registryFields = squadRegistryObject.data.content.fields as any;
        const ownerSquadsTableId = registryFields.owner_squads.fields.id.id;
        const squadsTableId = registryFields.squads.fields.id.id;

        console.log("📋 Owner squads table ID:", ownerSquadsTableId);
        console.log("📋 Squads table ID:", squadsTableId);

        // Check if user has squads by querying the owner_squads table
        try {
          const ownerSquadsFields = await suiClient.getDynamicFields({
            parentId: ownerSquadsTableId,
          });

          console.log("🔍 Owner squads fields:", ownerSquadsFields);

          // Find the user's entry in the owner_squads table
          const userSquadEntry = ownerSquadsFields.data.find(field => {
            if (field.name.type === "address" && field.name.value === currentAccount.address) {
              return true;
            }
            return false;
          });

          if (!userSquadEntry) {
            console.log("📝 User has no squads");
            return [];
          }

          console.log("🎯 Found user squad entry:", userSquadEntry);

          // Get the squad IDs for this user
          const userSquadIdsObject = await suiClient.getObject({
            id: userSquadEntry.objectId,
            options: { showContent: true },
          });

          if (!userSquadIdsObject.data?.content || userSquadIdsObject.data.content.dataType !== "moveObject") {
            console.log("❌ Failed to fetch user squad IDs");
            return [];
          }

          const squadIds = (userSquadIdsObject.data.content.fields as any).value;
          console.log("🎯 User squad IDs:", squadIds);

          if (!squadIds || squadIds.length === 0) {
            console.log("📝 User has no squads");
            return [];
          }

          // Fetch each squad's details
          const squadsData: SquadData[] = [];

          for (const squadId of squadIds) {
            try {
              // Get the squad from the squads table using dynamic field query
              const squadFields = await suiClient.getDynamicFields({
                parentId: squadsTableId,
              });

              const squadEntry = squadFields.data.find(field => {
                if (field.name.type === "u64" && field.name.value === squadId.toString()) {
                  return true;
                }
                return false;
              });

              if (!squadEntry) {
                console.log(`❌ Squad ${squadId} not found in squads table`);
                continue;
              }

              // Get the squad object details
              const squadObject = await suiClient.getObject({
                id: squadEntry.objectId,
                options: { showContent: true },
              });

              if (!squadObject.data?.content || squadObject.data.content.dataType !== "moveObject") {
                console.log(`❌ Failed to fetch squad ${squadId} details`);
                continue;
              }

              const squadData = (squadObject.data.content.fields as any).value.fields;
              console.log(`📊 Squad ${squadId} data:`, squadData);

              const squad: SquadData = {
                squad_id: Number(squadData.squad_id),
                name: squadData.name,
                owner: squadData.owner,
                players: squadData.players || [],
                life: Number(squadData.life),
                death_time: squadData.death_time ? Number(squadData.death_time) : undefined,
              };

              squadsData.push(squad);

            } catch (error) {
              console.error(`❌ Error fetching squad ${squadId}:`, error);
            }
          }

          console.log("✅ Final squads data:", squadsData);
          return squadsData;

        } catch (error) {
          console.log("❌ Error checking owner squads table:", error);
          return [];
        }

      } catch (error) {
        console.error("❌ Error fetching user squads:", error);
        return [];
      }
    },
    enabled: !!currentAccount?.address && !!squadRegistryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

// Hook to check if user has enough balance for squad creation
export const useCanCreateSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const feeConfigId = useNetworkVariable("feeConfigId");
  const { data: squadCreationFee } = useGetSquadCreationFee();

  return useQuery({
    queryKey: ["can-create-squad", currentAccount?.address, feeConfigId],
    queryFn: async () => {
      if (!currentAccount?.address || !squadCreationFee) {
        return false;
      }

      try {
        // Get user's SUI balance
        const balance = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: "0x2::sui::SUI",
        });

        const userBalanceInMist = BigInt(balance.totalBalance);
        const requiredFeeInMist = BigInt(squadCreationFee.feeInMist);

        // Check if user has enough balance for squad creation fee
        return userBalanceInMist >= requiredFeeInMist;
      } catch (error) {
        console.error("Error checking squad creation balance:", error);
        return false;
      }
    },
    enabled: !!currentAccount?.address && !!squadCreationFee,
  });
};

// Hook for creating a bid for horn locking
export const useCreateBid = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const activeSquadRegistryId = useNetworkVariable("activeSquadRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");

  return useMutation({
    mutationKey: ["create-bid"],
    mutationFn: async ({
      squadId,
      bidAmountInSui,
      durationInMinutes,
    }: {
      squadId: number;
      bidAmountInSui: number;
      durationInMinutes: number;
    }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      // Convert SUI to MIST and minutes to milliseconds
      const bidAmountInMist = Math.floor(bidAmountInSui * Number(MIST_PER_SUI));
      const durationInMs = durationInMinutes * 60 * 1000;

      console.log(`Creating bid: Squad ${squadId}, Amount ${bidAmountInSui} SUI (${bidAmountInMist} MIST), Duration ${durationInMinutes}min (${durationInMs}ms)`);

      // Get fee configuration to calculate total required payment
      const feeConfigObject = await suiClient.getObject({
        id: feeConfigId,
        options: { showContent: true },
      });

      if (!feeConfigObject.data?.content || feeConfigObject.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch fee configuration");
      }

      const feeConfig = feeConfigObject.data.content.fields as any;
      const bidFeeRate = Number(feeConfig.bid_fee_rate) / 10000; // Convert basis points to decimal
      const feeAmountInMist = Math.floor(bidAmountInMist * bidFeeRate);
      const totalRequiredInMist = bidAmountInMist + feeAmountInMist;

      console.log(`Fee calculation: ${bidFeeRate * 100}% = ${feeAmountInMist} MIST, Total required: ${totalRequiredInMist} MIST`);

      // Create transaction
      const tx = new Transaction();

      // Split coins for payment (bid amount + fee)
      const [payment] = tx.splitCoins(tx.gas, [totalRequiredInMist]);

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
          tx.pure.u64(bidAmountInMist),
          tx.pure.u64(durationInMs),
          payment,
          tx.object("0x6"), // Clock object
        ],
      });

      // Execute transaction
      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Bid created successfully:", result);
              resolve({
                result,
                squadId,
                bidAmountInSui,
                durationInMinutes,
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

// Hook for getting user's active bids
export const useGetUserBids = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const escrowRegistryId = useNetworkVariable("escrowRegistryId");

  return useQuery({
    queryKey: ["user-bids", currentAccount?.address, escrowRegistryId],
    queryFn: async () => {
      if (!currentAccount?.address || !escrowRegistryId) {
        return [];
      }

      try {
        // Get escrow registry to check for user's bids
        const escrowRegistry = await suiClient.getObject({
          id: escrowRegistryId,
          options: { showContent: true },
        });

        if (!escrowRegistry.data?.content || escrowRegistry.data.content.dataType !== "moveObject") {
          console.log("Failed to fetch escrow registry");
          return [];
        }

        const registryFields = escrowRegistry.data.content.fields as any;
        const activeBids = registryFields.active_bids || [];

        // Filter bids created by current user
        const userBids = activeBids.filter((bid: any) => bid.creator === currentAccount.address);

        return userBids.map((bid: any) => ({
          id: bid.id,
          squadId: Number(bid.squad_id),
          bidAmount: Number(bid.bid_amount),
          duration: Number(bid.duration),
          createdAt: Number(bid.created_at),
          status: bid.status,
        }));
      } catch (error) {
        console.error("Error fetching user bids:", error);
        return [];
      }
    },
    enabled: !!currentAccount?.address && !!escrowRegistryId,
  });
}; 