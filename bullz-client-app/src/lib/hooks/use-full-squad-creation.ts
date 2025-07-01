import { useMutation } from "@tanstack/react-query";
import { useCreateCompleteSquad } from "./use-squad-contract";
import { SquadForm } from "@/routes/squad/types";

export interface FullSquadCreationData {
  squadForm: SquadForm;
}

// Hook that handles the complete squad creation process in a single PTB:
// 1. Create empty squad on-chain
// 2. Add players and set name
// Both operations are combined in a single Programmable Transaction Block
export const useFullSquadCreation = () => {
  const createCompleteSquadMutation = useCreateCompleteSquad();

  return useMutation({
    mutationKey: ["full-squad-creation"],
    mutationFn: async ({ squadForm }: FullSquadCreationData) => {
      try {
        console.log("Creating complete squad on blockchain...");
        
        const playerNames = squadForm.players.map(player => player.name);
        
        const result = await createCompleteSquadMutation.mutateAsync({
          squadName: squadForm.name,
          playerNames,
        });

        console.log("Squad creation completed successfully");
        
        return {
          squadId: (result as any).squadId,
          result,
          squadForm,
        };
      } catch (error) {
        console.error("Squad creation failed:", error);
        throw error;
      }
    },
  });
};

// Hook for just the status/loading states
export const useSquadCreationStatus = () => {
  const createCompleteSquadMutation = useCreateCompleteSquad();
  const fullCreationMutation = useFullSquadCreation();

  return {
    // Individual operation states (for the combined PTB)
    isCreatingCompleteSquad: createCompleteSquadMutation.isPending,
    createCompleteSquadError: createCompleteSquadMutation.error,
    createCompleteSquadSuccess: createCompleteSquadMutation.isSuccess,
    
    // Full creation states
    isCreatingFull: fullCreationMutation.isPending,
    fullCreationError: fullCreationMutation.error,
    fullCreationSuccess: fullCreationMutation.isSuccess,
    
    // Overall states
    isAnyLoading: createCompleteSquadMutation.isPending || fullCreationMutation.isPending,
    hasAnyError: createCompleteSquadMutation.isError || fullCreationMutation.isError,
    isAllSuccess: fullCreationMutation.isSuccess,
    
    // Backward compatibility for UI that expects separate steps
    isCreatingSquad: createCompleteSquadMutation.isPending,
    isAddingPlayers: false, // No longer separate step
    createSquadError: createCompleteSquadMutation.error,
    addPlayersError: null, // No longer separate step
    createSquadSuccess: createCompleteSquadMutation.isSuccess,
    addPlayersSuccess: createCompleteSquadMutation.isSuccess,
  };
}; 