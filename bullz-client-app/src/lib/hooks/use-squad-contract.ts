import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../../networkConfig";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { extractSquadIdFromTransaction } from "../sui/transaction-utils";

// Types for squad data based on contract structure
export interface SquadData {
  squad_id: number;
  owner: string;
  name: string;
  players: string[];
  formation: string;
  life: number;
  death_time?: number;
}

// Hook for creating a new squad (empty squad)
export const useCreateSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const userStatsRegistryId = useNetworkVariable("userStatsRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");
  const feesId = useNetworkVariable("feesId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["create-squad"],
    mutationFn: async () => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      console.log("Creating new squad");

      try {
        // Get the actual creation fee from the contract
        const feeResult = await suiClient.devInspectTransactionBlock({
          transactionBlock: (() => {
            const inspectTx = new Transaction();
            inspectTx.moveCall({
              package: packageId,
              module: "squad_manager",
              function: "calculate_squad_creation_payment",
              arguments: [inspectTx.object(feeConfigId)],
            });
            return inspectTx;
          })(),
          sender: currentAccount.address,
        });

        let creationFeeInMist = 1000000000; // 1 SUI as fallback (default from contract)
        
        // Try to parse the actual fee from inspection result
        if (feeResult.results && feeResult.results[0] && feeResult.results[0].returnValues) {
          try {
            const returnValue = feeResult.results[0].returnValues[0];
            if (returnValue && returnValue[1]) {
              const feeBytes = returnValue[1] as unknown as number[];
              // Parse u64 from bytes (little endian)
              if (Array.isArray(feeBytes) && feeBytes.length >= 8) {
                let fee = 0;
                for (let i = 0; i < 8; i++) {
                  fee += (feeBytes[i] as number) * Math.pow(256, i);
                }
                creationFeeInMist = fee;
                console.log("Parsed creation fee from contract:", creationFeeInMist);
              }
            }
          } catch (parseError) {
            console.warn("Could not parse fee from contract, using fallback:", parseError);
          }
        }

        console.log("Using creation fee:", creationFeeInMist, "MIST");

      const tx = new Transaction();

      // Split coins for payment
        const [payment] = tx.splitCoins(tx.gas, [creationFeeInMist]);

        // Call create_squad function (creates empty squad)
      tx.moveCall({
        package: packageId,
        module: "squad_manager",
        function: "create_squad",
        arguments: [
          tx.object(squadRegistryId),
            tx.object(userStatsRegistryId),
          tx.object(feeConfigId),
          tx.object(feesId),
          payment,
            tx.object("0x6"), // Clock object
        ],
      });

        return new Promise((resolve, reject) => {
          signAndExecute(
            { transaction: tx },
            {
              onSuccess: (result) => {
                console.log("Squad created successfully:", result);
                queryClient.invalidateQueries({ queryKey: ["user-squads"] });
                resolve({ result });
              },
              onError: (error) => {
                console.error("Failed to create squad:", error);
                reject(error);
              },
            }
          );
        });

      } catch (error) {
        console.error("Error setting up squad creation transaction:", error);
        throw error;
      }
    },
  });
};

// Hook for adding players to an existing squad
export const useAddPlayersToSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["add-players-to-squad"],
    mutationFn: async ({
      squadId,
      squadName,
      formation,
      players,
    }: {
      squadId: number;
      squadName: string;
      formation: string;
      players: string[];
    }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      if (players.length !== 7) {
        throw new Error("Squad must have exactly 7 players");
      }

      console.log(`Adding players to squad ${squadId}`);

      const tx = new Transaction();

      // Call add_players_to_squad function (no payment required)
      tx.moveCall({
        package: packageId,
        module: "squad_manager",
        function: "add_players_to_squad",
        arguments: [
          tx.object(squadRegistryId),
          tx.pure.u64(squadId),
          tx.pure.string(squadName),
          tx.pure.string(formation),
          tx.pure.vector("string", players),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Players added successfully:", result);
              queryClient.invalidateQueries({ queryKey: ["user-squads"] });
              resolve({
                result,
                squadId,
                squadName,
                formation,
                players,
              });
            },
            onError: (error) => {
              console.error("Failed to add players:", error);
              reject(error);
            },
          }
        );
      });
    },
  });
};

// Combined hook for creating complete squad (create + add players)
export const useCreateCompleteSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const userStatsRegistryId = useNetworkVariable("userStatsRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");
  const feesId = useNetworkVariable("feesId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["create-complete-squad"],
    mutationFn: async ({
      squadName,
      playerNames,
      formation,
    }: {
      squadName: string;
      playerNames: string[];
      formation: string;
    }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      if (playerNames.length !== 7) {
        throw new Error("Squad must have exactly 7 players");
      }

      console.log("Creating complete squad:", { squadName, playerNames, formation });

      try {
        // Get the actual creation fee from the contract
        const feeResult = await suiClient.devInspectTransactionBlock({
          transactionBlock: (() => {
            const inspectTx = new Transaction();
            inspectTx.moveCall({
              package: packageId,
              module: "squad_manager",
              function: "calculate_squad_creation_payment",
              arguments: [inspectTx.object(feeConfigId)],
            });
            return inspectTx;
          })(),
          sender: currentAccount.address,
        });

        let creationFeeInMist = 1000000000; // 1 SUI as fallback (default from contract)
        
        // Try to parse the actual fee from inspection result
        if (feeResult.results && feeResult.results[0] && feeResult.results[0].returnValues) {
          try {
            const returnValue = feeResult.results[0].returnValues[0];
            if (returnValue && returnValue[1]) {
              const feeBytes = returnValue[1] as unknown as number[];
              // Parse u64 from bytes (little endian)
              if (Array.isArray(feeBytes) && feeBytes.length >= 8) {
                let fee = 0;
                for (let i = 0; i < 8; i++) {
                  fee += (feeBytes[i] as number) * Math.pow(256, i);
                }
                creationFeeInMist = fee;
                console.log("Parsed creation fee from contract:", creationFeeInMist);
              }
            }
          } catch (parseError) {
            console.warn("Could not parse fee from contract, using fallback:", parseError);
          }
        }

        console.log("Using creation fee:", creationFeeInMist, "MIST");

        // Create a single transaction that creates squad and adds players
        const tx = new Transaction();

        // Split coins for payment
        const [payment] = tx.splitCoins(tx.gas, [creationFeeInMist]);

        // Step 1: Create empty squad and get the squad ID
        const squadResult = tx.moveCall({
          package: packageId,
          module: "squad_manager",
          function: "create_squad",
          arguments: [
            tx.object(squadRegistryId),
            tx.object(userStatsRegistryId),
            tx.object(feeConfigId),
            tx.object(feesId),
            payment,
            tx.object("0x6"), // Clock object
          ],
        });

        // The create_squad function should return the squad ID
        // For now, we'll need to use the next_squad_id from the registry
        // Let's get the current squad ID first
        const registryObject = await suiClient.getObject({
          id: squadRegistryId,
                options: { showContent: true },
              });

        let nextSquadId = 1;
        if (registryObject.data?.content && 'fields' in registryObject.data.content) {
          const fields = registryObject.data.content.fields as any;
          nextSquadId = parseInt(fields.next_squad_id || "1");
        }

        console.log("Next squad ID will be:", nextSquadId);

        // Step 2: Add players to the squad using the expected squad ID
        tx.moveCall({
          package: packageId,
          module: "squad_manager",
          function: "add_players_to_squad",
          arguments: [
            tx.object(squadRegistryId),
            tx.pure.u64(nextSquadId),
            tx.pure.string(squadName),
            tx.pure.string(formation), // Use the passed formation instead of hardcoding
            tx.pure.vector("string", playerNames),
          ],
        });

        return new Promise((resolve, reject) => {
          signAndExecute(
            { transaction: tx },
            {
              onSuccess: (result) => {
                console.log("Complete squad creation successful:", result);
                queryClient.invalidateQueries({ queryKey: ["user-squads"] });
                resolve({
                  result,
                  squadId: nextSquadId,
                  squadName,
                  playerNames,
                });
              },
              onError: (error) => {
                console.error("Failed to create complete squad:", error);
                reject(error);
              },
            }
          );
        });

        } catch (error) {
        console.error("Error setting up squad creation transaction:", error);
        throw error;
      }
    },
  });
};

// Hook for updating squad name only
export const useUpdateSquadName = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");
  const feesId = useNetworkVariable("feesId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["update-squad-name"],
    mutationFn: async ({
      squadId,
      newName,
    }: {
      squadId: number;
      newName: string;
    }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      console.log(`Updating squad ${squadId} name to: ${newName}`);

      try {
        // Get the actual update fee from the contract
        const feeResult = await suiClient.devInspectTransactionBlock({
          transactionBlock: (() => {
            const inspectTx = new Transaction();
            inspectTx.moveCall({
              package: packageId,
              module: "squad_manager",
              function: "calculate_squad_update_payment",
              arguments: [inspectTx.object(feeConfigId)],
            });
            return inspectTx;
          })(),
          sender: currentAccount.address,
        });

        let updateFeeInMist = 1000000000; // 1 SUI as fallback (default from contract)
        
        // Try to parse the actual fee from inspection result
        if (feeResult.results && feeResult.results[0] && feeResult.results[0].returnValues) {
          try {
            const returnValue = feeResult.results[0].returnValues[0];
            if (returnValue && returnValue[1]) {
              const feeBytes = returnValue[1] as unknown as number[];
              // Parse u64 from bytes (little endian)
              if (Array.isArray(feeBytes) && feeBytes.length >= 8) {
                let fee = 0;
                for (let i = 0; i < 8; i++) {
                  fee += (feeBytes[i] as number) * Math.pow(256, i);
                }
                updateFeeInMist = fee;
                console.log("Parsed update fee from contract:", updateFeeInMist);
              }
            }
          } catch (parseError) {
            console.warn("Could not parse fee from contract, using fallback:", parseError);
          }
        }

        const tx = new Transaction();
        const [payment] = tx.splitCoins(tx.gas, [updateFeeInMist]);

        // Call update_squad_name function
        tx.moveCall({
          package: packageId,
          module: "squad_manager",
          function: "update_squad_name",
          arguments: [
            tx.object(squadRegistryId),
            tx.object(feeConfigId),
            tx.object(feesId),
            tx.pure.u64(squadId),
            tx.pure.string(newName),
            payment,
          ],
        });

        return new Promise((resolve, reject) => {
          signAndExecute(
            { transaction: tx },
            {
              onSuccess: (result) => {
                console.log("Squad name updated successfully:", result);
                queryClient.invalidateQueries({ queryKey: ["user-squads"] });
                resolve({
                  result,
                  squadId,
                  newName,
                });
              },
              onError: (error) => {
                console.error("Failed to update squad name:", error);
                reject(error);
              },
            }
          );
        });

      } catch (error) {
        console.error("Error setting up squad name update transaction:", error);
        throw error;
      }
    },
  });
};

// Hook for updating squad players only
export const useUpdateSquadPlayers = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");
  const feesId = useNetworkVariable("feesId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["update-squad-players"],
    mutationFn: async ({
      squadId,
      newPlayers,
    }: {
      squadId: number;
      newPlayers: string[];
    }) => {
        if (!currentAccount?.address) {
          throw new Error("Wallet not connected");
        }

      if (newPlayers.length !== 7) {
        throw new Error("Squad must have exactly 7 players");
      }

      console.log(`Updating squad ${squadId} players`);

      try {
        // Get the actual update fee from the contract
        const feeResult = await suiClient.devInspectTransactionBlock({
          transactionBlock: (() => {
            const inspectTx = new Transaction();
            inspectTx.moveCall({
              package: packageId,
              module: "squad_manager",
              function: "calculate_squad_update_payment",
              arguments: [inspectTx.object(feeConfigId)],
            });
            return inspectTx;
          })(),
          sender: currentAccount.address,
        });

        let updateFeeInMist = 1000000000; // 1 SUI as fallback (default from contract)
        
        // Try to parse the actual fee from inspection result
        if (feeResult.results && feeResult.results[0] && feeResult.results[0].returnValues) {
          try {
            const returnValue = feeResult.results[0].returnValues[0];
            if (returnValue && returnValue[1]) {
              const feeBytes = returnValue[1] as unknown as number[];
              // Parse u64 from bytes (little endian)
              if (Array.isArray(feeBytes) && feeBytes.length >= 8) {
                let fee = 0;
                for (let i = 0; i < 8; i++) {
                  fee += (feeBytes[i] as number) * Math.pow(256, i);
                }
                updateFeeInMist = fee;
                console.log("Parsed update fee from contract:", updateFeeInMist);
              }
            }
          } catch (parseError) {
            console.warn("Could not parse fee from contract, using fallback:", parseError);
          }
        }

        const tx = new Transaction();
        const [payment] = tx.splitCoins(tx.gas, [updateFeeInMist]);

        // Call update_squad_players function
        tx.moveCall({
          package: packageId,
          module: "squad_manager",
          function: "update_squad_players",
          arguments: [
            tx.object(squadRegistryId),
            tx.object(feeConfigId),
            tx.object(feesId),
            tx.pure.u64(squadId),
            tx.pure.vector("string", newPlayers),
            payment,
          ],
        });

        return new Promise((resolve, reject) => {
          signAndExecute(
            { transaction: tx },
            {
              onSuccess: (result) => {
                console.log("Squad players updated successfully:", result);
                queryClient.invalidateQueries({ queryKey: ["user-squads"] });
                resolve({
                  result,
                  squadId,
                  newPlayers,
                });
              },
              onError: (error) => {
                console.error("Failed to update squad players:", error);
                reject(error);
              },
            }
          );
        });

      } catch (error) {
        console.error("Error setting up squad players update transaction:", error);
        throw error;
      }
    },
  });
};

// Hook for deleting squad
export const useDeleteSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["delete-squad"],
    mutationFn: async ({ squadId }: { squadId: number }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      console.log(`Deleting squad ${squadId}`);

      const tx = new Transaction();

      // Call delete_squad function (no payment required)
      tx.moveCall({
        package: packageId,
        module: "squad_manager",
        function: "delete_squad",
        arguments: [
          tx.object(squadRegistryId),
          tx.pure.u64(squadId),
          tx.object("0x6"), // Clock object
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Squad deleted successfully:", result);
              queryClient.invalidateQueries({ queryKey: ["user-squads"] });
              resolve({
                result,
                squadId,
              });
            },
            onError: (error) => {
              console.error("Failed to delete squad:", error);
              reject(error);
            },
          }
        );
      });
    },
  });
};

// Hook for reviving squad
export const useReviveSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");
  const userStatsRegistryId = useNetworkVariable("userStatsRegistryId");
  const feeConfigId = useNetworkVariable("feeConfigId");
  const feesId = useNetworkVariable("feesId");
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["revive-squad"],
    mutationFn: async ({ squadId }: { squadId: number }) => {
      if (!currentAccount?.address) {
        throw new Error("Wallet not connected");
      }

      console.log(`Reviving squad ${squadId}`);

      try {
        // The contract automatically determines instant vs standard revival based on time
        // We need to provide payment that covers the maximum possible fee
        // Default instant revival fee is 0.1 SUI (100,000,000 MIST)
        const maxRevivalFeeInMist = 100000000; // 0.1 SUI as max estimate from contract default

        const tx = new Transaction();
        const [payment] = tx.splitCoins(tx.gas, [maxRevivalFeeInMist]);

        // Call revive_squad function
        tx.moveCall({
          package: packageId,
          module: "squad_manager",
          function: "revive_squad",
          arguments: [
            tx.object(squadRegistryId),
            tx.object(userStatsRegistryId),
            tx.object(feeConfigId),
            tx.object(feesId),
            tx.pure.u64(squadId),
            payment,
            tx.object("0x6"), // Clock object
          ],
        });

        return new Promise((resolve, reject) => {
          signAndExecute(
            { transaction: tx },
            {
              onSuccess: (result) => {
                console.log("Squad revived successfully:", result);
                queryClient.invalidateQueries({ queryKey: ["user-squads"] });
                resolve({
                  result,
                  squadId,
                });
              },
              onError: (error) => {
                console.error("Failed to revive squad:", error);
                reject(error);
              },
            }
          );
        });

      } catch (error) {
        console.error("Error setting up squad revival transaction:", error);
        throw error;
      }
    },
  });
};

// Hook for fetching user's squads
export const useGetUserSquads = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const squadRegistryId = useNetworkVariable("squadRegistryId");

  return useQuery({
    queryKey: ["user-squads", currentAccount?.address],
    queryFn: async (): Promise<SquadData[]> => {
      if (!currentAccount?.address) {
        return [];
      }

      try {
        console.log("🔍 Fetching user squads for:", currentAccount.address);

        // Step 1: Get the squad registry to access the owner_squads table
        const registryObject = await suiClient.getObject({
          id: squadRegistryId,
          options: { showContent: true },
        });

        if (!registryObject.data?.content || !('fields' in registryObject.data.content)) {
          console.log("❌ Could not access squad registry");
          return [];
        }

        const registryFields = registryObject.data.content.fields as any;
        const ownerSquadsTableId = registryFields.owner_squads?.fields?.id?.id;

        if (!ownerSquadsTableId) {
          console.log("❌ Could not find owner_squads table");
          return [];
        }

        console.log("✅ Found owner_squads table:", ownerSquadsTableId);

        // Step 2: Try to get the dynamic field for this user's address
        let squadIds: number[] = [];
        try {
          const userSquadIds = await suiClient.getDynamicFieldObject({
            parentId: ownerSquadsTableId,
            name: {
              type: "address",
              value: currentAccount.address,
            },
          });

          if (userSquadIds.data?.content && 'fields' in userSquadIds.data.content) {
            const squadIdsArray = (userSquadIds.data.content.fields as any).value;
            if (Array.isArray(squadIdsArray)) {
              squadIds = squadIdsArray.map(id => parseInt(id.toString()));
              console.log("✅ Found squad IDs:", squadIds);
            }
          }
        } catch (error) {
          console.log("User has no squads (expected if first time):", error);
          return [];
        }

        if (squadIds.length === 0) {
          console.log("✅ User has no squads");
          return [];
        }

        // Step 3: For each squad ID, get the squad details from the squads table
        const squadsTableId = registryFields.squads?.fields?.id?.id;
        if (!squadsTableId) {
          console.log("❌ Could not find squads table");
          return [];
        }

        console.log("✅ Found squads table:", squadsTableId);

        const userSquads: SquadData[] = [];

        for (const squadId of squadIds) {
          try {
            console.log(`🔍 Fetching squad ${squadId} details`);
            
            const squadObject = await suiClient.getDynamicFieldObject({
              parentId: squadsTableId,
              name: {
                type: "u64",
                value: squadId.toString(),
              },
            });

            if (squadObject.data?.content && 'fields' in squadObject.data.content) {
              const squadFields = (squadObject.data.content.fields as any).value?.fields;
              
              if (squadFields) {
                const squadData: SquadData = {
                  squad_id: squadId,
                  owner: squadFields.owner || currentAccount.address,
                  name: squadFields.name || `Squad ${squadId}`,
                  players: squadFields.players || [],
                  formation: squadFields.formation || "OneThreeTwoOne",
                  life: parseInt(squadFields.life?.toString() || "5"),
                  death_time: squadFields.death_time ? parseInt(squadFields.death_time.toString()) : undefined,
                };

                console.log(`✅ Squad ${squadId} data:`, squadData);
                userSquads.push(squadData);
              }
            }
          } catch (error) {
            console.error(`❌ Error fetching squad ${squadId}:`, error);
          }
        }

        console.log("✅ Final user squads:", userSquads);
        return userSquads;

      } catch (error) {
        console.error("❌ Error fetching user squads:", error);
        return [];
      }
    },
    enabled: !!currentAccount?.address,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Hook for getting squad creation fee
export const useGetSquadCreationFee = () => {
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable("packageId");
  const feeConfigId = useNetworkVariable("feeConfigId");

  return useQuery({
    queryKey: ["squad-creation-fee"],
    queryFn: async (): Promise<{ feeInMist: number; feeInSui: number }> => {
      try {
        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          package: packageId,
              module: "squad_manager",
              function: "calculate_squad_creation_payment",
              arguments: [tx.object(feeConfigId)],
            });
            return tx;
          })(),
          sender: "0x0000000000000000000000000000000000000000000000000000000000000001", // Dummy sender for inspection
        });

        if (result.error) {
          console.error("Error fetching creation fee:", result.error);
          return { feeInMist: 1000000000, feeInSui: 1.0 }; // 1 SUI fallback
        }

        // Try to parse the actual fee from inspection result
        if (result.results && result.results[0] && result.results[0].returnValues) {
          try {
            const returnValue = result.results[0].returnValues[0];
            if (returnValue && returnValue[1]) {
              const feeBytes = returnValue[1] as unknown as number[];
              // Parse u64 from bytes (little endian)
              if (Array.isArray(feeBytes) && feeBytes.length >= 8) {
                let fee = 0;
                for (let i = 0; i < 8; i++) {
                  fee += (feeBytes[i] as number) * Math.pow(256, i);
                }
                return { feeInMist: fee, feeInSui: fee / Number(MIST_PER_SUI) };
              }
            }
          } catch (parseError) {
            console.warn("Could not parse fee from contract:", parseError);
          }
        }

        return { feeInMist: 1000000000, feeInSui: 1.0 }; // 1 SUI fallback
      } catch (error) {
        console.error("Error fetching creation fee:", error);
        return { feeInMist: 1000000000, feeInSui: 1.0 }; // 1 SUI fallback
      }
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Hook for checking if user can create squad
export const useCanCreateSquad = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  return useQuery({
    queryKey: ["can-create-squad", currentAccount?.address],
    queryFn: async (): Promise<boolean> => {
      if (!currentAccount?.address) {
        return false;
      }

      try {
        // Check if user has enough balance for minimum fee (1 SUI + gas)
        const balance = await suiClient.getBalance({
          owner: currentAccount.address,
        });

        const balanceValue = parseInt(balance.totalBalance);
        const minRequired = 1100000000; // 1.1 SUI minimum for 1 SUI fee + gas

        return balanceValue >= minRequired;
      } catch (error) {
        console.error("Error checking if can create squad:", error);
        return false;
      }
    },
    enabled: !!currentAccount?.address,
    refetchInterval: 60000, // Refetch every minute
  });
}; 