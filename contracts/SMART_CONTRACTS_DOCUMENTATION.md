# Bullfy Smart Contracts Documentation

This document provides detailed documentation of the Bullfy smart contracts, including their structs, constants, functions, events, and overall logic.

---

## 1. Module: bullfy::squad_manager

### Purpose
Manages football squads, including creation, updating, retrieval, and deletion of squads.

### Structs

- **Squad**
  - Fields:
    - `id: UID` — Unique identifier.
    - `owner: address` — Owner of the squad.
    - `squad_id: u64` — Unique ID for the squad.
    - `name: String` — Name of the squad.
    - `players: vector<String>` — List of players in the squad.
  - Traits: `key, store`

- **SquadRegistry**
  - Fields:
    - `id: UID` — Unique identifier.
    - `squads: Table<u64, Squad>` — Mapping of squad IDs to squads.
    - `owner_squads: Table<address, vector<u64>>` — Mapping of owner addresses to their squad IDs.
    - `next_squad_id: u64` — Counter for generating unique squad IDs.
  - Traits: `key`

### Events

- **SquadCreated**
  - Fields:
    - `owner: address` — Owner of the squad.
    - `squad_id: u64` — Unique ID of the created squad.
    - `name: String` — Name of the squad.
  - Traits: `copy, drop`

### Constants

- **SQUAD_CREATION_FEE**: `u64 = 1_000_000_000` — Fee required to create a squad (1 SUI in MIST).

### Error Constants

- **EInsufficientFee**: "Insufficient fee provided"
- **EOwnerAlreadyHasSquad**: "Owner already has a squad"
- **EOwnerDoesNotHaveSquad**: "Owner does not have a squad"

### Functions

#### Public Entry Functions

- **create_squad**
  - Parameters:
    - `registry: &mut SquadRegistry` — Mutable reference to the squad registry.
    - `fees: &mut fee_collector::Fees` — Mutable reference to fee collector.
    - `payment: Coin<SUI>` — Payment for squad creation.
    - `name: String` — Name of the squad.
    - `players: vector<String>` — List of players for the squad.
    - `ctx: &mut TxContext` — Transaction context.
  - Description: Creates a new squad with the given name and players. Squad is immutable after creation. Requires payment of 1 SUI.

- **delete_squad**
  - Parameters:
    - `registry: &mut SquadRegistry` — Mutable reference to the squad registry.
    - `squad_id: u64` — ID of the squad to delete.
    - `ctx: &mut TxContext` — Transaction context.
  - Description: Deletes a squad. Only the squad owner can delete.

#### Public View Functions

- **get_squad**
  - Parameters:
    - `registry: &SquadRegistry` — Reference to the squad registry.
    - `squad_id: u64` — ID of the squad.
  - Returns: `&Squad` — Reference to the squad.
  - Description: Retrieves a squad by its ID.

- **get_owner_squads**
  - Parameters:
    - `registry: &SquadRegistry` — Reference to the squad registry.
    - `owner: address` — Address of the owner.
  - Returns: `&vector<u64>` — Reference to the list of squad IDs owned by the address.
  - Description: Retrieves all squad IDs for a given owner.

- **has_squads**
  - Parameters:
    - `registry: &SquadRegistry` — Reference to the squad registry.
    - `owner: address` — Address of the owner.
  - Returns: `bool` — True if the owner has squads.
  - Description: Checks if an owner has any squads.

- **get_squad_name**
  - Parameters:
    - `squad: &Squad` — Reference to the squad.
  - Returns: `&String` — Reference to the squad name.
  - Description: Gets the name of a squad.

- **get_squad_players**
  - Parameters:
    - `squad: &Squad` — Reference to the squad.
  - Returns: `&vector<String>` — Reference to the list of players.
  - Description: Gets the players of a squad.

- **get_squad_owner**
  - Parameters:
    - `squad: &Squad` — Reference to the squad.
  - Returns: `address` — The owner address.
  - Description: Gets the owner of a squad.

- **get_squad_id**
  - Parameters:
    - `squad: &Squad` — Reference to the squad.
  - Returns: `u64` — The squad ID.
  - Description: Gets the ID of a squad.

### Usage Example

1. **Creating a Squad**: Call `create_squad` with payment, name, and complete players list. Squad is immutable after creation.
2. **Retrieving Squads**: Use `get_squad` or `get_owner_squads` to access squad data.
3. **Deleting a Squad**: Call `delete_squad` with the squad ID to remove it permanently.

---

## 2. Module: bullfy::match_escrow

### Purpose
Handles escrow functionality for matches, managing deposits, match results, and payouts.

### Structs

- **MatchEscrow**
  - Fields:
    - `id: UID` — Unique identifier.
    - `player1: address` — Address of player 1.
    - `player2: address` — Address of player 2.
    - `amount: Balance<SUI>` — Escrowed amount.
    - `match_id: u64` — ID of the match.
    - `is_active: bool` — Whether the escrow is active.
  - Traits: `key`

- **EscrowRegistry**
  - Fields:
    - `id: UID` — Unique identifier.
    - `escrows: Table<u64, MatchEscrow>` — Mapping of match IDs to escrows.
    - `next_match_id: u64` — Counter for generating unique match IDs.
  - Traits: `key`

### Events

- **MatchEscrowCreated**
  - Fields:
    - `match_id: u64` — ID of the match.
    - `player1: address` — Address of player 1.
    - `player2: address` — Address of player 2.
    - `amount: u64` — Escrowed amount.
  - Traits: `copy, drop`

- **MatchResultSubmitted**
  - Fields:
    - `match_id: u64` — ID of the match.
    - `winner: address` — Address of the winner.
    - `amount: u64` — Payout amount.
  - Traits: `copy, drop`

### Functions

#### Public Entry Functions

- **create_escrow**: Creates a new match escrow with deposits from both players.
- **submit_result**: Submits match result and releases funds to the winner.
- **cancel_match**: Cancels a match and refunds both players.

#### Public View Functions

- **get_escrow**: Retrieves escrow details by match ID.
- **is_match_active**: Checks if a match is currently active.

---

## 3. Module: bullfy::squad_player_challenge

### Purpose
Manages challenges between squad players, including challenge creation, acceptance, and resolution.

### Key Features

- **Challenge Creation**: Players can create challenges with specific terms.
- **Challenge Acceptance**: Other players can accept open challenges.
- **Result Submission**: Winners can submit results and claim rewards.
- **Fee Collection**: Platform fees are collected on successful matches.

---

## 4. Module: bullfy::admin

### Purpose
Provides administrative functions for managing the platform.

### Functions

- **AdminCap**: Capability object for administrative operations.
- **set_fees**: Updates platform fee rates.
- **withdraw_fees**: Withdraws collected fees.
- **pause_system**: Emergency pause functionality.

---

## 5. Module: bullfy::fee_collector

### Purpose
Handles collection and management of platform fees.

### Functions

- **collect**: Collects fees from transactions.
- **withdraw**: Withdraws collected fees (admin only).
- **get_balance**: Returns current fee balance.

---

## Summary

The Bullfy smart contracts provide a comprehensive system for managing fantasy football squads and matches on the Sui blockchain. The simplified squad system now focuses on just player names and a list of players, making it more flexible while maintaining all core functionality for escrow, challenges, and fee collection. 