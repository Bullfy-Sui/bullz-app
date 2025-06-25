# Bullfy Smart Contracts Documentation

This document provides comprehensive documentation of the Bullfy smart contracts, including their structs, constants, functions, events, and overall logic.

**Package Name:** `bullfy`  
**Edition:** `2024.beta`  
**Dependencies:** Sui Framework, Pyth Network, Wormhole

---

## 1. Module: bullfy::squad_manager

### Purpose
Manages football squads for the Bullfy platform, including creation, life management, player addition, and revival mechanisms.

### Structs

- **Squad**
  - Fields:
    - `id: UID` — Unique identifier
    - `owner: address` — Owner of the squad
    - `squad_id: u64` — Unique squad ID
    - `name: String` — Name of the squad
    - `players: vector<String>` — List of players in the squad
    - `life: u64` — Life points (starts at 5)
    - `death_time: Option<u64>` — Timestamp when squad died (None if alive)
  - Traits: `key, store`

- **SquadRegistry**
  - Fields:
    - `id: UID` — Unique identifier
    - `squads: Table<u64, Squad>` — Mapping of squad IDs to squads
    - `owner_squads: Table<address, vector<u64>>` — Mapping of owners to their squad IDs
    - `next_squad_id: u64` — Counter for generating unique squad IDs
  - Traits: `key`

### Events

- **SquadCreated**
  - Fields: `owner: address`, `squad_id: u64`, `name: String`, `life: u64`, `fee_paid: u64`
  - Traits: `copy, drop`

- **SquadLifeLost**
  - Fields: `squad_id: u64`, `remaining_life: u64`
  - Traits: `copy, drop`

- **SquadLifeGained**
  - Fields: `squad_id: u64`, `life_gained: u64`, `new_life: u64`
  - Traits: `copy, drop`

- **SquadDied**
  - Fields: `squad_id: u64`, `death_time: u64`
  - Traits: `copy, drop`

- **SquadRevived**
  - Fields: `squad_id: u64`, `revived_at: u64`, `revival_type: String`, `fee_paid: u64`
  - Traits: `copy, drop`

- **PlayersAddedToSquad**
  - Fields: `squad_id: u64`, `players_added: vector<String>`, `total_players: u64`
  - Traits: `copy, drop`

### Constants

- **MIN_SQUAD_NAME_LENGTH**: `u64 = 1`
- **MAX_SQUAD_NAME_LENGTH**: `u64 = 50`
- **INITIAL_SQUAD_LIFE**: `u64 = 5`
- **REVIVAL_WAIT_TIME_MS**: `u64 = 864_00_000` (24 hours)

### Error Constants

- **E_SQUAD_NOT_FOUND**: `u64 = 4001`
- **E_CANNOT_REVIVE_YET**: `u64 = 4003`
- **E_REVIVAL_NOT_NEEDED**: `u64 = 4004`
- **E_INVALID_SQUAD_NAME**: `u64 = 4005`

### Functions

#### Public Entry Functions

- **create_squad**: Creates a new squad with validation, fee payment, and event emission
- **revive_squad_standard**: Revives a dead squad after 24-hour wait period (0.05 SUI default fee)
- **revive_squad_instant**: Revives a dead squad instantly without wait period (0.1 SUI default fee)
- **delete_squad**: Deletes a squad (owner only)
- **add_players_to_squad**: Adds exactly 7 players to a squad with duplicate validation

#### Public View Functions

- **get_squad**: Retrieves squad by ID
- **get_owner_squads**: Gets all squad IDs for an owner
- **has_squads**: Checks if owner has any squads
- **is_squad_alive**: Checks if squad has life > 0
- **can_revive_squad_standard**: Checks if squad can be revived after 24h wait
- **can_revive_squad_instant**: Checks if squad can be revived instantly
- **calculate_squad_creation_payment**: Helper for fee calculation
- **calculate_standard_revival_payment**: Helper for standard revival fee
- **calculate_instant_revival_payment**: Helper for instant revival fee

#### Public Functions

- **decrease_squad_life**: Decreases life by 1, records death if needed
- **increase_squad_life**: Increases life by 1 (max 5)

---

## 2. Module: bullfy::match_escrow

### Purpose
Handles sophisticated bid-based escrow system for player-vs-player matches with automatic matching, time limits, and prize distribution.

### Enums

- **BidStatus**
  - Values: `Open`, `Matched`, `Cancelled`
  - Traits: `copy, drop, store`

- **MatchStatus**
  - Values: `Active`, `Completed`, `Disputed`
  - Traits: `copy, drop, store`

### Structs

- **Bid**
  - Fields:
    - `id: UID`, `creator: address`, `squad_id: u64`, `bid_amount: u64`
    - `duration: u64`, `escrow: Balance<SUI>`, `fee_balance: Balance<SUI>`
    - `created_at: u64`, `status: BidStatus`
  - Traits: `key, store`

- **Match**
  - Fields:
    - `id: UID`, `bid1_id: ID`, `bid2_id: ID`
    - `player1: address`, `player2: address`, `squad1_id: u64`, `squad2_id: u64`
    - `total_prize: u64`, `total_fees: u64`, `duration: u64`
    - `started_at: u64`, `ends_at: u64`, `status: MatchStatus`
    - `winner: Option<address>`, `prize_claimed: bool`, `fees_collected: bool`
    - `squad1_token_prices: vector<u64>`, `squad2_token_prices: vector<u64>` (token prices at match start)
    - `squad1_final_token_prices: vector<u64>`, `squad2_final_token_prices: vector<u64>` (token prices at match completion)
  - Traits: `key, store`

- **EscrowRegistry**
  - Fields: Complex registry with active/completed bids and matches, user tracking tables
  - Traits: `key`

### Events

- **BidCreated**: `bid_id: ID`, `creator: address`, `squad_id: u64`, `bid_amount: u64`, `duration: u64`
- **BidsMatched**: Match creation details with both players and prize info, includes `squad1_token_prices: vector<u64>`, `squad2_token_prices: vector<u64>`
- **BidCancelled**: `bid_id: ID`, `creator: address`, `refund_amount: u64`
- **MatchCompleted**: `match_id: ID`, `winner: address`, `loser: address`, `prize_amount: u64`, `total_fees: u64`, includes `squad1_final_token_prices: vector<u64>`, `squad2_final_token_prices: vector<u64>`
- **PrizeClaimed**: `match_id: ID`, `winner: address`, `amount: u64`

### Error Constants

- **E_BID_NOT_FOUND**: `u64 = 3001`
- **E_CANNOT_MATCH_OWN_BID**: `u64 = 3002`
- **E_BID_AMOUNT_MISMATCH**: `u64 = 3003`
- **E_DURATION_MISMATCH**: `u64 = 3004`
- **E_MATCH_NOT_FOUND**: `u64 = 3005`
- **E_MATCH_NOT_ACTIVE**: `u64 = 3006`
- **E_MATCH_ALREADY_COMPLETED**: `u64 = 3007`
- **E_INVALID_WINNER**: `u64 = 3008`
- **E_MATCH_NOT_ENDED_YET**: `u64 = 3009`

### Constants

- **MIN_BID_AMOUNT**: `u64 = 1_000_000` (0.001 SUI)
- **MIN_DURATION**: `u64 = 60_000` (1 minute)
- **MAX_DURATION**: `u64 = 1_800_000` (30 minutes)

### Functions

#### Public Entry Functions

- **create_bid**: Creates a new bid with squad validation and fee escrow
- **match_bids**: Matches two compatible bids into an active match (Admin only)
- **cancel_bid**: Cancels an open bid and refunds the creator
- **complete_match**: Completes a match by declaring a winner (Admin only, requires match time to have ended)
- **claim_prize**: Claims prize after match completion (Admin only)

#### Public Helper Functions

- **is_bid_valid**: Checks if a bid is still valid for matching
- **has_match_ended**: Checks if a match has ended based on time
- **can_complete_match**: Checks if a match can be completed (status, time validation)

#### Public View Functions

- **get_bid**: Retrieves active bid by ID
- **get_match**: Retrieves active match by ID
- **get_completed_bid_by_id**: Retrieves completed bid by ID
- **get_completed_match_by_id**: Retrieves completed match by ID
- **is_bid_completed**: Checks if bid is in completed table
- **is_match_completed**: Checks if match is in completed table
- Various user tracking functions for bids and matches

---

## 3. Module: bullfy::squad_player_challenge

### Purpose
Manages squad-based challenges and tracks active squad participation.

### Structs

- **ActiveSquadRegistry**
  - Purpose: Tracks which squads are currently active in challenges
  - Traits: `key`

### Functions

- **is_squad_active**: Checks if a squad is currently participating in a challenge
- Various challenge management functions for squad-based competitions

---

## 4. Module: bullfy::admin

### Purpose
Provides administrative controls and fee configuration for the platform.

### Structs

- **AdminCap**
  - Fields: `id: UID`
  - Purpose: Capability object for administrative operations
  - Traits: `key`

- **OwnerCap**
  - Fields: `id: UID`
  - Purpose: Special capability for contract owner (highest privilege)
  - Traits: `key`

- **FeeConfig**
  - Fields:
    - `id: UID`
    - `upfront_fee_bps: u64` — Fee in basis points (500 = 5%)
    - `squad_creation_fee: u64` — Squad creation fee in MIST
    - `standard_revival_fee: u64` — Standard revival fee in MIST
    - `instant_revival_fee: u64` — Instant revival fee in MIST
  - Traits: `key`

### Events

- **AdminCapCreated**: `admin: address`
- **AdminCapRevoked**: `admin: address`
- **FeePercentageUpdated**: `old_fee_bps: u64`, `new_fee_bps: u64`, `updated_by: address`
- **SquadCreationFeeUpdated**: `old_fee: u64`, `new_fee: u64`, `updated_by: address`
- **RevivalFeesUpdated**: Comprehensive revival fee update info

### Constants

- **MAX_FEE_BPS**: `u64 = 1000` (10% maximum fee)
- **MIN_SQUAD_CREATION_FEE**: `u64 = 100_000_000` (0.1 SUI minimum)
- **MAX_SQUAD_CREATION_FEE**: `u64 = 10_000_000_000` (10 SUI maximum)
- **MIN_REVIVAL_FEE**: `u64 = 10_000_000` (0.01 SUI minimum)
- **MAX_REVIVAL_FEE**: `u64 = 1_000_000_000` (1 SUI maximum)

### Functions

#### Public Entry Functions

- **create_admin_cap**: Creates new admin capabilities (owner only)
- **revoke_admin_cap**: Revokes admin capabilities (owner only)
- **transfer_owner_cap**: Transfers ownership to new address
- **update_fee_percentage**: Updates platform fee percentage (admin only)
- **update_squad_creation_fee**: Updates squad creation fees (admin only)
- **update_revival_fees**: Updates revival fees (admin only)

#### Public Functions

- **get_upfront_fee_bps**: Returns current upfront fee percentage
- **get_squad_creation_fee**: Returns squad creation fee amount
- **get_standard_revival_fee**: Returns standard revival fee amount
- **get_instant_revival_fee**: Returns instant revival fee amount

---

## 5. Module: bullfy::fee_collector

### Purpose
Centralized collection and management of platform fees.

### Structs

- **Fees**
  - Fields:
    - `id: UID`
    - `total: Balance<SUI>` — Total collected fees
  - Traits: `key`

### Events

- **FeeCollected**: `amount: u64`, `collector_id: ID`, `payer: address`
- **FeeWithdrawn**: `amount: u64`, `recipient: address`

### Functions

#### Public Functions

- **collect**: Adds incoming fees to the total balance
- **withdraw**: Withdraws specific amount (admin only)
- **withdraw_all**: Withdraws all collected fees (admin only)
- **get_total**: Returns total collected fees

---

## 6. Module: bullfy::fee_calculator

### Purpose
Provides standardized fee calculation logic across the platform.

### Functions

#### Public Functions

- **calculate_upfront_fee**: Calculates required upfront fees based on bid amount and fee configuration
- Returns fee amount and total required payment

---

## 7. Module: bullfy::payment_utils

### Purpose
Handles payment processing, validation, and change management.

### Functions

#### Public Functions

- **validate_payment_amount**: Validates sufficient payment for required amount
- **handle_payment_with_fee**: Splits payment into main amount and fee portions
- **handle_payment_with_change**: Processes payments and returns change if necessary

---

## 8. Module: bullfy::validators

### Purpose
Provides common validation functions used across multiple modules.

### Functions

#### Public Functions

- **validate_bid_amount**: Validates bid amounts against minimum requirements
- **validate_duration**: Validates match duration within acceptable limits
- **validate_squad_ownership_and_life**: Validates squad ownership and life status

---

## 9. Module: bullfy::common_errors

### Purpose
Centralized error definitions for consistent error handling across modules.

### Functions

#### Public Functions

- **unauthorized**: Returns unauthorized access error
- **squad_already_active**: Returns squad already active error
- **insufficient_funds**: Returns insufficient funds error

---

## Architecture Overview

The Bullfy smart contracts implement a comprehensive fantasy football platform with the following key features:

### **Squad Management System**
- Life-based mechanics (5 life points, lose on defeat, gain on victory)
- Death and revival system with waiting periods
- Player roster management (exactly 7 players per squad)

### **Sophisticated Escrow System**
- Bid-based matching for fair competition
- Automatic prize pool calculation
- Time-limited matches with mandatory expiration checking
- Fee collection integrated into all transactions

### **Administrative Controls**
- Multi-level permission system (Owner > Admin)
- Configurable fees and parameters
- Emergency functions and dispute resolution

### **Modular Architecture**
- Separation of concerns with dedicated utility modules
- Consistent error handling and validation
- Reusable payment and fee calculation logic

### **Economic Model**
- Squad creation fees
- Match participation fees (percentage-based)
- Revival fees (standard vs instant options)
- Platform fee collection and withdrawal

This architecture provides a robust, scalable foundation for a competitive fantasy football platform on the Sui blockchain. 