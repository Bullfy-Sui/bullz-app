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

- **SquadUpdated**
  - Fields: `squad_id: u64`, `updated_by: address`, `name_changed: bool`, `players_changed: bool`, `new_name: String`, `new_players: vector<String>`, `total_players: u64`
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

- **create_squad**
  - **Purpose**: Creates a new squad with initial settings and collects creation fee
  - **Arguments**:
    - `squad_registry: &mut SquadRegistry` — Registry for squad management
    - `fee_config: &FeeConfig` — Configuration for fees
    - `fees: &mut fee_collector::Fees` — Fee collector object
    - `payment: Coin<SUI>` — SUI payment for creation fee
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Emits**: `SquadCreated` event

- **revive_squad**
  - **Purpose**: Revives a dead squad with automatic fee calculation based on time since death
  - **Arguments**:
    - `squad_registry: &mut SquadRegistry` — Registry for squad management
    - `fee_config: &FeeConfig` — Configuration for fees
    - `fees: &mut fee_collector::Fees` — Fee collector object
    - `squad_id: u64` — ID of the squad to revive
    - `payment: Coin<SUI>` — SUI payment for revival fee
    - `clock: &Clock` — System clock for time validation
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Fee Logic**: Standard revival (24h+ wait, lower fee) vs Instant revival (immediate, higher fee)
  - **Emits**: `SquadRevived` event

- **add_players_to_squad**
  - **Purpose**: Adds exactly 7 players to a squad and sets the squad name
  - **Arguments**:
    - `registry: &mut SquadRegistry` — Registry for squad management
    - `squad_id: u64` — ID of the squad to modify
    - `squad_name: String` — Squad name (1-50 characters)
    - `player_names: vector<String>` — Vector of exactly 7 player names
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Owner only, duplicate checking, exact count requirement
  - **Emits**: `PlayersAddedToSquad` event

- **update_squad**
  - **Purpose**: Updates squad name and/or players (flexible update function)
  - **Arguments**:
    - `registry: &mut SquadRegistry` — Registry for squad management
    - `squad_id: u64` — ID of the squad to update
    - `new_squad_name: Option<String>` — Optional new squad name (1-50 characters)
    - `new_player_names: Option<vector<String>>` — Optional new player list (exactly 7 players)
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Owner only, at least one field must be updated, duplicate checking for players
  - **Emits**: `SquadUpdated` event

- **update_squad_name**
  - **Purpose**: Helper function to update only squad name
  - **Arguments**:
    - `registry: &mut SquadRegistry` — Registry for squad management
    - `squad_id: u64` — ID of the squad to update
    - `new_squad_name: String` — New squad name (1-50 characters)
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Owner only, name length validation
  - **Emits**: `SquadUpdated` event

- **update_squad_players**
  - **Purpose**: Helper function to update only squad players
  - **Arguments**:
    - `registry: &mut SquadRegistry` — Registry for squad management
    - `squad_id: u64` — ID of the squad to update
    - `new_player_names: vector<String>` — New player list (exactly 7 players)
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Owner only, exact count requirement, duplicate checking
  - **Emits**: `SquadUpdated` event

#### Public View Functions

- **get_squad**
  - **Purpose**: Retrieves squad by ID
  - **Arguments**:
    - `registry: &SquadRegistry` — Registry to search in
    - `squad_id: u64` — ID of the squad to retrieve
  - **Returns**: `&Squad` — Reference to the squad object

- **get_owner_squads**
  - **Purpose**: Gets all squad IDs for an owner
  - **Arguments**:
    - `registry: &SquadRegistry` — Registry to search in
    - `owner: address` — Address of the owner
  - **Returns**: `&vector<u64>` — Reference to vector of squad IDs

- **has_squads**
  - **Purpose**: Checks if owner has any squads
  - **Arguments**:
    - `registry: &SquadRegistry` — Registry to check
    - `owner: address` — Address to check
  - **Returns**: `bool` — True if owner has squads

- **is_squad_alive**
  - **Purpose**: Checks if squad has life > 0
  - **Arguments**:
    - `squad: &Squad` — Squad to check
  - **Returns**: `bool` — True if squad has life points

- **can_revive_standard**
  - **Purpose**: Checks if squad can be revived after 24h wait
  - **Arguments**:
    - `squad: &Squad` — Squad to check
    - `clock: &Clock` — System clock for time validation
  - **Returns**: `bool` — True if standard revival is available

- **can_revive_instant**
  - **Purpose**: Checks if squad can be revived instantly
  - **Arguments**:
    - `squad: &Squad` — Squad to check
  - **Returns**: `bool` — True if instant revival is available

- **calculate_squad_creation_payment**
  - **Purpose**: Helper for fee calculation
  - **Arguments**:
    - `fee_config: &FeeConfig` — Fee configuration
  - **Returns**: `u64` — Required payment amount in MIST

- **calculate_revival_payment**
  - **Purpose**: Calculates revival fee based on current time
  - **Arguments**:
    - `squad: &Squad` — Squad to calculate for
    - `fee_config: &FeeConfig` — Fee configuration
    - `clock: &Clock` — System clock for time calculation
  - **Returns**: `(u64, String)` — Fee amount and revival type

- **calculate_revival_fee**
  - **Purpose**: Gets revival fee for specific type
  - **Arguments**:
    - `revival_type: String` — Type ("standard" or "instant")
    - `fee_config: &FeeConfig` — Fee configuration
  - **Returns**: `u64` — Fee amount in MIST

#### Public Functions

- **decrease_squad_life**
  - **Purpose**: Decreases life by 1, records death if needed
  - **Arguments**:
    - `registry: &mut SquadRegistry` — Squad registry
    - `squad_id: u64` — ID of squad to modify
    - `clock: &Clock` — System clock for death timestamp
  - **Returns**: None
  - **Emits**: `SquadLifeLost`, potentially `SquadDied`

- **increase_squad_life**
  - **Purpose**: Increases life by 1 (max 5)
  - **Arguments**:
    - `registry: &mut SquadRegistry` — Squad registry
    - `squad_id: u64` — ID of squad to modify
  - **Returns**: None
  - **Emits**: `SquadLifeGained`

- **get_squad_name**
  - **Purpose**: Returns squad name
  - **Arguments**: `squad: &Squad` — Squad to query
  - **Returns**: `&String` — Reference to squad name

- **get_squad_players**
  - **Purpose**: Returns squad players list
  - **Arguments**: `squad: &Squad` — Squad to query
  - **Returns**: `&vector<String>` — Reference to players vector

- **get_squad_owner**
  - **Purpose**: Returns squad owner address
  - **Arguments**: `squad: &Squad` — Squad to query
  - **Returns**: `address` — Owner address

- **get_squad_id**
  - **Purpose**: Returns squad ID
  - **Arguments**: `squad: &Squad` — Squad to query
  - **Returns**: `u64` — Squad ID

- **get_squad_life**
  - **Purpose**: Returns squad life points
  - **Arguments**: `squad: &Squad` — Squad to query
  - **Returns**: `u64` — Current life points

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

- **create_bid**
  - **Purpose**: Creates a new bid with squad validation and fee escrow
  - **Arguments**:
    - `registry: &mut EscrowRegistry` — The escrow registry
    - `squad_registry: &SquadRegistry` — Squad registry for validation
    - `active_squad_registry: &mut ActiveSquadRegistry` — Registry for tracking active squads
    - `fee_config: &FeeConfig` — Fee configuration
    - `squad_id: u64` — ID of the squad to use in match
    - `bid_amount: u64` — Bid amount in MIST (min 0.001 SUI)
    - `duration: u64` — Match duration in milliseconds (1-30 minutes)
    - `payment: Coin<SUI>` — SUI payment for bid and fee
    - `clock: &Clock` — System clock
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Squad ownership, life status, bid/duration ranges, squad not active
  - **Emits**: `BidCreated` event

- **match_bids**
  - **Purpose**: Matches two compatible bids into an active match (Admin only)
  - **Arguments**:
    - `signer_cap: &MatchSignerCap` — Match signer capability for authorization
    - `registry: &mut EscrowRegistry` — The escrow registry
    - `_squad_registry: &SquadRegistry` — Squad registry (for validation)
    - `active_squad_registry: &mut ActiveSquadRegistry` — Active squad registry
    - `bid1_id: ID` — ID of the first bid
    - `bid2_id: ID` — ID of the second bid
    - `squad1_token_prices: vector<u64>` — Token prices for squad 1 at match start
    - `squad2_token_prices: vector<u64>` — Token prices for squad 2 at match start
    - `clock: &Clock` — System clock
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Bid compatibility (amount, duration), different creators
  - **Emits**: `BidsMatched` event

- **cancel_bid**
  - **Purpose**: Cancels an open bid and refunds the creator
  - **Arguments**:
    - `registry: &mut EscrowRegistry` — The escrow registry
    - `active_squad_registry: &mut ActiveSquadRegistry` — Active squad registry
    - `bid_id: ID` — ID of the bid to cancel
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Creator authorization, bid status (must be Open)
  - **Emits**: `BidCancelled` event

- **complete_match**
  - **Purpose**: Completes a match by declaring a winner (Admin only, requires match time to have ended)
  - **Arguments**:
    - `signer_cap: &MatchSignerCap` — Match signer capability
    - `registry: &mut EscrowRegistry` — The escrow registry
    - `squad_registry: &mut SquadRegistry` — Squad registry for life updates
    - `active_squad_registry: &mut ActiveSquadRegistry` — Active squad registry
    - `match_id: ID` — ID of the match to complete
    - `winner: address` — Address of the winner
    - `squad1_final_token_prices: vector<u64>` — Final token prices for squad 1
    - `squad2_final_token_prices: vector<u64>` — Final token prices for squad 2
    - `clock: &Clock` — System clock for time validation
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Match ended, valid winner, signer authorization
  - **Effects**: Updates squad life (winner +1, loser -1)
  - **Emits**: `MatchCompleted` event

- **claim_prize**
  - **Purpose**: Claims prize after match completion (Admin only)
  - **Arguments**:
    - `signer_cap: &MatchSignerCap` — Match signer capability
    - `registry: &mut EscrowRegistry` — The escrow registry
    - `fees: &mut Fees` — Fee collector object
    - `match_id: ID` — ID of the completed match
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Effects**: Transfers prize to winner, collects fees
  - **Emits**: `PrizeClaimed` event

#### Public Helper Functions

- **is_bid_valid**
  - **Purpose**: Checks if a bid is still valid for matching
  - **Arguments**:
    - `bid: &Bid` — Bid to validate
    - `_clock: &Clock` — System clock (currently unused)
  - **Returns**: `bool` — True if bid can be matched

- **has_match_ended**
  - **Purpose**: Checks if a match has ended based on time
  - **Arguments**:
    - `match_obj: &Match` — Match to check
    - `clock: &Clock` — System clock for time comparison
  - **Returns**: `bool` — True if current time >= match end time

- **can_complete_match**
  - **Purpose**: Checks if a match can be completed (status, time validation)
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to check
    - `match_id: ID` — Match ID to validate
    - `clock: &Clock` — System clock for time validation
  - **Returns**: `bool` — True if match can be completed

#### Public View Functions

- **get_bid**
  - **Purpose**: Retrieves active bid by ID
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to search
    - `bid_id: ID` — Bid ID to retrieve
  - **Returns**: `&Bid` — Reference to bid object

- **get_match**
  - **Purpose**: Retrieves active match by ID
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to search
    - `match_id: ID` — Match ID to retrieve
  - **Returns**: `&Match` — Reference to match object

- **get_completed_bid_by_id**
  - **Purpose**: Retrieves completed bid by ID
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to search
    - `bid_id: ID` — Bid ID to retrieve
  - **Returns**: `&Bid` — Reference to completed bid

- **get_completed_match_by_id**
  - **Purpose**: Retrieves completed match by ID
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to search
    - `match_id: ID` — Match ID to retrieve
  - **Returns**: `&Match` — Reference to completed match

- **is_bid_completed**
  - **Purpose**: Checks if bid is in completed table
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to check
    - `bid_id: ID` — Bid ID to check
  - **Returns**: `bool` — True if bid is completed

- **is_match_completed**
  - **Purpose**: Checks if match is in completed table
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to check
    - `match_id: ID` — Match ID to check
  - **Returns**: `bool` — True if match is completed

- **get_user_active_bids**
  - **Purpose**: Gets active bid indices for a user
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to query
    - `user: address` — User address
  - **Returns**: `&vector<u64>` — Reference to user's active bid indices

- **get_user_completed_bids**
  - **Purpose**: Gets completed bid IDs for a user
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to query
    - `user: address` — User address
  - **Returns**: `&vector<ID>` — Reference to user's completed bid IDs

- **get_user_active_matches**
  - **Purpose**: Gets active match indices for a user
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to query
    - `user: address` — User address
  - **Returns**: `&vector<u64>` — Reference to user's active match indices

- **get_user_completed_matches**
  - **Purpose**: Gets completed match IDs for a user
  - **Arguments**:
    - `registry: &EscrowRegistry` — Registry to query
    - `user: address` — User address
  - **Returns**: `&vector<ID>` — Reference to user's completed match IDs

- **get_match_squad1_start_prices**
  - **Purpose**: Gets starting token prices for squad 1
  - **Arguments**:
    - `match_obj: &Match` — Match to query
  - **Returns**: `&vector<u64>` — Reference to price vector

- **get_match_squad2_start_prices**
  - **Purpose**: Gets starting token prices for squad 2
  - **Arguments**:
    - `match_obj: &Match` — Match to query
  - **Returns**: `&vector<u64>` — Reference to price vector

- **get_match_squad1_final_prices**
  - **Purpose**: Gets final token prices for squad 1
  - **Arguments**:
    - `match_obj: &Match` — Match to query
  - **Returns**: `&vector<u64>` — Reference to price vector

- **get_match_squad2_final_prices**
  - **Purpose**: Gets final token prices for squad 2
  - **Arguments**:
    - `match_obj: &Match` — Match to query
  - **Returns**: `&vector<u64>` — Reference to price vector

- **has_final_prices_recorded**
  - **Purpose**: Checks if final prices have been recorded
  - **Arguments**:
    - `match_obj: &Match` — Match to check
  - **Returns**: `bool` — True if final prices are set

---

## 3. Module: bullfy::squad_player_challenge

### Purpose
Manages squad-based challenges and tracks active squad participation.

### Structs

- **ActiveSquadRegistry**
  - Purpose: Tracks which squads are currently active in challenges
  - Traits: `key`

### Functions

- **is_squad_active**
  - **Purpose**: Checks if a squad is currently participating in a challenge
  - **Arguments**:
    - `registry: &ActiveSquadRegistry` — Registry to check
    - `squad_id: u64` — Squad ID to check
  - **Returns**: `bool` — True if squad is active

- **register_squad_active**
  - **Purpose**: Registers a squad as active in a challenge
  - **Arguments**:
    - `registry: &mut ActiveSquadRegistry` — Registry to update
    - `squad_id: u64` — Squad ID to register
    - `challenge_id: ID` — Challenge or match ID
  - **Returns**: None

- **unregister_squad_active**
  - **Purpose**: Removes a squad from active status
  - **Arguments**:
    - `registry: &mut ActiveSquadRegistry` — Registry to update
    - `squad_id: u64` — Squad ID to unregister
  - **Returns**: None

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

- **create_admin_cap**
  - **Purpose**: Creates new admin capabilities (owner only)
  - **Arguments**:
    - `_: &OwnerCap` — Owner capability for authorization
    - `registry: &mut AdminRegistry` — Admin registry to update
    - `admin: address` — Address to grant admin privileges
    - `clock: &Clock` — System clock for timestamp
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Effects**: Creates and transfers AdminCap to specified address
  - **Emits**: `AdminCapCreated` event

- **revoke_admin_cap**
  - **Purpose**: Revokes admin capabilities (owner only)
  - **Arguments**:
    - `_: &OwnerCap` — Owner capability for authorization
    - `registry: &mut AdminRegistry` — Admin registry to update
    - `admin_cap: AdminCap` — Admin capability to revoke
    - `clock: &Clock` — System clock for timestamp
  - **Returns**: None (entry function)
  - **Effects**: Deletes AdminCap and removes from registry
  - **Emits**: `AdminCapRevoked` event

- **deactivate_admin**
  - **Purpose**: Allows admin to temporarily deactivate their capability
  - **Arguments**:
    - `admin_cap: &mut AdminCap` — Admin capability to deactivate
    - `clock: &Clock` — System clock for timestamp
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Admin owns the capability
  - **Emits**: `AdminDeactivated` event

- **reactivate_admin**
  - **Purpose**: Allows admin to reactivate their capability
  - **Arguments**:
    - `admin_cap: &mut AdminCap` — Admin capability to reactivate
    - `clock: &Clock` — System clock for timestamp
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Admin owns the capability
  - **Emits**: `AdminReactivated` event

- **transfer_owner_cap**
  - **Purpose**: Transfers ownership to new address
  - **Arguments**:
    - `owner_cap: OwnerCap` — Owner capability to transfer
    - `new_owner: address` — New owner address
  - **Returns**: None (entry function)
  - **Effects**: Transfers OwnerCap to new address

- **update_fee_percentage**
  - **Purpose**: Updates platform fee percentage (admin only)
  - **Arguments**:
    - `admin_cap: &AdminCap` — Admin capability for authorization
    - `fee_config: &mut FeeConfig` — Fee configuration to update
    - `new_fee_bps: u64` — New fee in basis points (max 1000 = 10%)
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Admin authorization, fee within limits
  - **Emits**: `FeePercentageUpdated` event

- **update_squad_creation_fee**
  - **Purpose**: Updates squad creation fees (admin only)
  - **Arguments**:
    - `admin_cap: &AdminCap` — Admin capability for authorization
    - `fee_config: &mut FeeConfig` — Fee configuration to update
    - `new_fee: u64` — New fee amount in MIST (0.1-10 SUI range)
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Admin authorization, fee within limits
  - **Emits**: `SquadCreationFeeUpdated` event

- **update_revival_fees**
  - **Purpose**: Updates revival fees (admin only)
  - **Arguments**:
    - `admin_cap: &AdminCap` — Admin capability for authorization
    - `fee_config: &mut FeeConfig` — Fee configuration to update
    - `new_standard_fee: u64` — New standard revival fee in MIST
    - `new_instant_fee: u64` — New instant revival fee in MIST
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None (entry function)
  - **Validation**: Admin authorization, fees within limits, instant > standard
  - **Emits**: `RevivalFeesUpdated` event

#### Public Functions

- **validate_admin_cap**
  - **Purpose**: Validates admin capability and activity status
  - **Arguments**:
    - `admin_cap: &AdminCap` — Admin capability to validate
    - `ctx: &mut TxContext` — Transaction context for sender check
  - **Returns**: `bool` — True if admin is valid and active

- **is_active_admin**
  - **Purpose**: Checks if address is an active admin
  - **Arguments**:
    - `registry: &AdminRegistry` — Registry to check
    - `admin_address: address` — Address to check
  - **Returns**: `bool` — True if address is active admin

- **get_active_admins**
  - **Purpose**: Returns list of all active admin addresses
  - **Arguments**:
    - `registry: &AdminRegistry` — Registry to query
  - **Returns**: `&vector<address>` — Reference to active admins vector

- **get_admin_count**
  - **Purpose**: Returns total number of admins
  - **Arguments**:
    - `registry: &AdminRegistry` — Registry to query
  - **Returns**: `u64` — Total admin count

- **get_admin_info**
  - **Purpose**: Returns admin capability information
  - **Arguments**:
    - `admin_cap: &AdminCap` — Admin capability to query
  - **Returns**: `(address, u64, bool)` — Admin address, created timestamp, active status

- **get_upfront_fee_bps**
  - **Purpose**: Returns current upfront fee percentage
  - **Arguments**:
    - `fee_config: &FeeConfig` — Fee configuration to query
  - **Returns**: `u64` — Fee percentage in basis points

- **get_squad_creation_fee**
  - **Purpose**: Returns squad creation fee amount
  - **Arguments**:
    - `fee_config: &FeeConfig` — Fee configuration to query
  - **Returns**: `u64` — Fee amount in MIST

- **get_standard_revival_fee**
  - **Purpose**: Returns standard revival fee amount
  - **Arguments**:
    - `fee_config: &FeeConfig` — Fee configuration to query
  - **Returns**: `u64` — Fee amount in MIST

- **get_instant_revival_fee**
  - **Purpose**: Returns instant revival fee amount
  - **Arguments**:
    - `fee_config: &FeeConfig` — Fee configuration to query
  - **Returns**: `u64` — Fee amount in MIST

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

- **collect**
  - **Purpose**: Adds incoming fees to the total balance
  - **Arguments**:
    - `fees: &mut Fees` — Fee collector object to update
    - `incoming: Coin<SUI>` — Incoming fee payment
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: None
  - **Effects**: Adds coin value to total balance
  - **Emits**: `FeeCollected` event

- **withdraw**
  - **Purpose**: Withdraws specific amount (admin only)
  - **Arguments**:
    - `fees: &mut Fees` — Fee collector object
    - `amount: u64` — Amount to withdraw in MIST
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: `Coin<SUI>` — Withdrawn amount as coin
  - **Validation**: Sufficient balance check
  - **Emits**: `FeeWithdrawn` event

- **withdraw_all**
  - **Purpose**: Withdraws all collected fees (admin only)
  - **Arguments**:
    - `fees: &mut Fees` — Fee collector object
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: `Coin<SUI>` — All fees as coin
  - **Emits**: `FeeWithdrawn` event

- **get_total**
  - **Purpose**: Returns total collected fees
  - **Arguments**:
    - `fees: &Fees` — Fee collector object to query
  - **Returns**: `u64` — Total balance in MIST

---

## 6. Module: bullfy::fee_calculator

### Purpose
Provides standardized fee calculation logic across the platform.

### Functions

#### Public Functions

- **calculate_upfront_fee**
  - **Purpose**: Calculates required upfront fees based on bid amount and fee configuration
  - **Arguments**:
    - `base_amount: u64` — Base bid amount in MIST
    - `fee_config: &FeeConfig` — Fee configuration for percentage
  - **Returns**: `(u64, u64)` — (fee_amount, total_required) both in MIST
  - **Formula**: fee = (base_amount * fee_bps) / 10000

- **calculate_fee_amount**
  - **Purpose**: Calculates just the fee amount
  - **Arguments**:
    - `base_amount: u64` — Base amount in MIST
    - `fee_config: &FeeConfig` — Fee configuration
  - **Returns**: `u64` — Fee amount in MIST

- **calculate_total_payment**
  - **Purpose**: Calculates total required payment (base + fee)
  - **Arguments**:
    - `base_amount: u64` — Base amount in MIST
    - `fee_config: &FeeConfig` — Fee configuration
  - **Returns**: `u64` — Total required payment in MIST

- **get_fee_bps**
  - **Purpose**: Gets fee basis points from configuration
  - **Arguments**:
    - `fee_config: &FeeConfig` — Fee configuration to query
  - **Returns**: `u64` — Fee percentage in basis points

---

## 7. Module: bullfy::payment_utils

### Purpose
Handles payment processing, validation, and change management.

### Functions

#### Public Functions

- **handle_payment_with_fee**
  - **Purpose**: Splits payment into main amount and fee portions
  - **Arguments**:
    - `payment: Coin<SUI>` — Payment coin to split
    - `main_amount: u64` — Main payment amount in MIST
    - `fee_amount: u64` — Fee amount in MIST
    - `recipient: address` — Address to send change (if any)
    - `ctx: &mut TxContext` — Transaction context
  - **Returns**: `(Coin<SUI>, Coin<SUI>)` — (main_coin, fee_coin)
  - **Effects**: Returns change to recipient if overpaid

- **validate_payment_amount**
  - **Purpose**: Validates sufficient payment for required amount
  - **Arguments**:
    - `payment_amount: u64` — Amount being paid in MIST
    - `required_amount: u64` — Required amount in MIST
  - **Returns**: None (aborts if insufficient)
  - **Validation**: payment_amount >= required_amount

- **is_payment_sufficient**
  - **Purpose**: Checks if payment amount is sufficient (returns bool)
  - **Arguments**:
    - `payment_amount: u64` — Amount being paid in MIST
    - `required_amount: u64` — Required amount in MIST
  - **Returns**: `bool` — True if payment is sufficient

- **calculate_total_required**
  - **Purpose**: Calculates total required payment (main + fee)
  - **Arguments**:
    - `main_amount: u64` — Main amount in MIST
    - `fee_amount: u64` — Fee amount in MIST
  - **Returns**: `u64` — Total required in MIST

---

## 8. Module: bullfy::validators

### Purpose
Provides common validation functions used across multiple modules.

### Functions

#### Public Functions

- **validate_squad_ownership_and_life**
  - **Purpose**: Validates squad ownership and life status
  - **Arguments**:
    - `squad_registry: &SquadRegistry` — Squad registry to check
    - `squad_id: u64` — Squad ID to validate
    - `owner: address` — Expected owner address
  - **Returns**: None (aborts if invalid)
  - **Validation**: Owner match, squad has life > 0

- **is_squad_valid_for_owner**
  - **Purpose**: Checks squad validity for owner (returns bool)
  - **Arguments**:
    - `squad_registry: &SquadRegistry` — Squad registry to check
    - `squad_id: u64` — Squad ID to validate
    - `owner: address` — Expected owner address
  - **Returns**: `bool` — True if squad is valid for owner

- **validate_bid_amount**
  - **Purpose**: Validates bid amounts against minimum requirements
  - **Arguments**:
    - `bid_amount: u64` — Bid amount in MIST
    - `min_amount: u64` — Minimum allowed amount in MIST
  - **Returns**: None (aborts if invalid)
  - **Validation**: bid_amount >= min_amount

- **is_bid_amount_valid**
  - **Purpose**: Checks if bid amount is valid (returns bool)
  - **Arguments**:
    - `bid_amount: u64` — Bid amount in MIST
    - `min_amount: u64` — Minimum allowed amount in MIST
  - **Returns**: `bool` — True if amount is valid

- **validate_duration**
  - **Purpose**: Validates match duration within acceptable limits
  - **Arguments**:
    - `duration: u64` — Duration in milliseconds
    - `min_duration: u64` — Minimum allowed duration
    - `max_duration: u64` — Maximum allowed duration
  - **Returns**: None (aborts if invalid)
  - **Validation**: min_duration <= duration <= max_duration

- **is_duration_valid**
  - **Purpose**: Checks if duration is valid (returns bool)
  - **Arguments**:
    - `duration: u64` — Duration in milliseconds
    - `min_duration: u64` — Minimum allowed duration
    - `max_duration: u64` — Maximum allowed duration
  - **Returns**: `bool` — True if duration is valid

---

## 9. Module: bullfy::common_errors

### Purpose
Centralized error definitions for consistent error handling across modules.

### Functions

#### Public Functions

- **unauthorized**
  - **Purpose**: Returns unauthorized access error code
  - **Arguments**: None
  - **Returns**: `u64` — Error code for unauthorized access

- **squad_not_owned**
  - **Purpose**: Returns squad not owned error code
  - **Arguments**: None
  - **Returns**: `u64` — Error code for squad ownership mismatch

- **squad_not_alive**
  - **Purpose**: Returns squad not alive error code
  - **Arguments**: None
  - **Returns**: `u64` — Error code for dead squad

- **squad_already_active**
  - **Purpose**: Returns squad already active error code
  - **Arguments**: None
  - **Returns**: `u64` — Error code for squad already in use

- **invalid_bid_amount**
  - **Purpose**: Returns invalid bid amount error code
  - **Arguments**: None
  - **Returns**: `u64` — Error code for invalid bid

- **insufficient_payment**
  - **Purpose**: Returns insufficient funds error code
  - **Arguments**: None
  - **Returns**: `u64` — Error code for payment issues

- **invalid_duration**
  - **Purpose**: Returns invalid duration error code
  - **Arguments**: None
  - **Returns**: `u64` — Error code for duration validation

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