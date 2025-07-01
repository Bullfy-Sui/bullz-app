import { SuiTransactionBlockResponse } from "@mysten/sui/client";

// Extract squad ID from transaction result
export function extractSquadIdFromTransaction(result: SuiTransactionBlockResponse): number | null {
  try {
    // Method 1: Look for SquadCreated event
    const events = result.events || [];
    
    for (const event of events) {
      if (event.type.includes("SquadCreated") || event.type.includes("squad_manager::SquadCreated")) {
        const parsedJson = event.parsedJson as any;
        const squadId = parsedJson?.squad_id;
        if (squadId !== undefined) {
          console.log("Found squad ID from SquadCreated event:", squadId);
          return Number(squadId);
        }
      }
    }

    // Method 2: Look for PlayersAddedToSquad event (backup)
    for (const event of events) {
      if (event.type.includes("PlayersAddedToSquad") || event.type.includes("squad_manager::PlayersAddedToSquad")) {
        const parsedJson = event.parsedJson as any;
        const squadId = parsedJson?.squad_id;
        if (squadId !== undefined) {
          console.log("Found squad ID from PlayersAddedToSquad event:", squadId);
          return Number(squadId);
        }
      }
    }

    // Method 3: Look at object changes for created Squad objects
    const objectChanges = result.objectChanges || [];
    
    for (const change of objectChanges) {
      if (change.type === "created" && change.objectType.includes("Squad")) {
        console.log("Found created Squad object:", change);
        // The squad ID might be in the object data, but we'd need to query the object
        // For now, we'll return a placeholder that indicates we found a squad
        return 1; // Temporary - would need to query the actual object for the ID
      }
    }

    console.warn("Could not extract squad ID from transaction events");
    return null;
  } catch (error) {
    console.error("Error extracting squad ID:", error);
    return null;
  }
}

// Extract transaction digest for later querying
export function extractTransactionDigest(result: SuiTransactionBlockResponse): string | null {
  return result.digest || null;
}

// Check if transaction was successful
export function isTransactionSuccessful(result: SuiTransactionBlockResponse): boolean {
  return result.effects?.status?.status === "success";
}

// Extract gas used from transaction
export function extractGasUsed(result: SuiTransactionBlockResponse): number {
  const gasUsed = result.effects?.gasUsed;
  if (!gasUsed) return 0;
  
  return Number(gasUsed.computationCost) + Number(gasUsed.storageCost);
}

// Extract all events of a specific type
export function extractEventsByType(result: SuiTransactionBlockResponse, eventType: string) {
  const events = result.events || [];
  return events.filter(event => event.type.includes(eventType));
} 