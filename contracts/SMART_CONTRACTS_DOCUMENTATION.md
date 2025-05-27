# Bullfy Smart Contracts Documentation

This document provides detailed documentation of the Bullfy smart contracts, including their structs, constants, functions, events, and overall logic.

---

## 1. Module: bullfy::squad_manager

### Purpose
Manages football squads and players, including creation, updating, retrieval, and deletion of squads and players.

### Structs

- **SquadFormation**
  - Fields:
    - `formation_type: u8` — Represents the formation type (e.g., 4-3-2-1).
  - Traits: `copy, drop, store`

- **Squad**
  - Fields:
    - `id: UID` — Unique identifier.
    - `owner: address` — Owner of the squad.
    - `squad_id: u64` — Unique ID for the squad.
    - `goalkeeper: Option<String>` — Goalkeeper name.
    - `defenders: vector<String>` — List of defenders.
    - `midfielders: vector<String>` — List of midfielders.
    - `forwards: vector<String>` — List of forwards.
    - `formation: SquadFormation` — Squad formation.
  - Traits: `key, store`

- **Player**
  - Fields:
    - `id: UID` — Unique identifier.
    - `name: String` — Player name.
    - `squad_owner: address` — Owner of the squad the player belongs to.
    - `token_price_id: String` — Token price identifier.
    - `allocated_value: u64` — Value allocated to the player.
    - `position: u8` — Player position.
  - Traits: `key, store`

- **SquadRegistry**
  - Fields:
    - `id: UID`
    - `squads: Table<u64, Squad>` — Mapping of squad ID to Squad.
    - `owner_squads: Table<address, vector<u64>>` — Mapping of owner address to their squad IDs.
    - `next_squad_id: u64` — Counter for next squad ID.
  - Traits: `key`

- **PlayerRegistry**
  - Fields:
    - `id: UID`
    - `players: Table<u64, Player>` — Mapping of player ID to Player.
    - `next_player_id: u64` — Counter for next player ID.
  - Traits: `key`

- **Events**
  - `SquadCreated` — Emitted when a squad is created.
  - `PlayerCreated` — Emitted when a player is created.

### Constants

- Error codes for validation (e.g., `ENotEnoughDefenders`, `EOwnerAlreadyHasSquad`).
- Formation constants (e.g., `FORMATION_4_3_2_1`).
- `SQUAD_CREATION_FEE: u64 = 1_000_000_000` — Fee required to create a squad (1 SUI).

### Key Functions

- `create_squad` — Creates a new squad with validation on player counts. Requires a payment of 1 SUI token that is sent to the fee collector.
- `update_squad` — Updates an existing squad.
- `create_player` — Creates a new player linked to a squad.
- `update_player` — Updates player details with ownership checks.
- `delete_squad` — Deletes a squad and its resources.
- `get_squad`, `get_player` — Retrieve squad or player by ID.
- `get_owner_squads` — Retrieves all squad IDs owned by an address.
- `has_squads`, `has_player` — Check existence.
- `formation_to_string` — Utility to convert formation type to string.

---

## 2. Module: bullfy::admin

### Purpose
Manages admin and owner capabilities for access control.

### Structs

- **AdminCap**
  - Capability for admin functions.
- **OwnerCap**
  - Capability for owner functions.

### Events

- `AdminCapCreated` — Emitted when an admin capability is created.
- `AdminCapRevoked` — Emitted when an admin capability is revoked.

### Constants

- Error code `ENotOwner` for unauthorized access.

### Key Functions

- `init` — Initializes OwnerCap and first AdminCap.
- `create_admin_cap` — Creates and transfers AdminCap to an address.
- `revoke_admin_cap` — Revokes an admin capability.
- `transfer_owner_cap` — Transfers ownership capability.

---

## 3. Module: bullfy::fee_collector

### Purpose
Handles fee collection and withdrawal.

### Structs

- **Fees**
  - Holds total collected fees as a `Balance<SUI>`.

### Events

- `FeeCollected` — Emitted when fees are collected.
- `FeeWithdrawn` — Emitted when fees are withdrawn.

### Constants

- Error codes for admin-only actions and insufficient balance.

### Key Functions

- `init` — Initializes the Fees object.
- `collect` — Adds incoming coins to fees.
- `withdraw` — Admin-only withdrawal of specified amount.
- `withdraw_all` — Admin-only withdrawal of all fees.
- `get_total` — Returns total fees collected.

---

## 4. Module: bullfy::match_escrow

### Purpose
Manages escrow for match bids and match lifecycle.

### Structs

- **Escrow**
  - Holds player bid details, amount, timestamp, and status.
- **MatchQueue**
  - Holds waiting matches in a table.
- **Status** (enum)
  - Match states: Waiting, Matched, Completed, Cancelled.

### Events

- `MatchEntered`, `MatchCompleted`, `BidRetrieved`.

### Constants

- Minimum bid amount and error codes.

### Key Functions

- `enter_match` — Player enters a match with a bid.
- `retrieve_bid_player` / `retrieve_bid_admin` — Retrieve bid funds.
- `complete_match` — Completes a match and transfers funds to winner.
- `get_match_info`, `get_waiting_count` — View functions.

---

## 5. Module: bullfy::squad_player_challenge

### Purpose
Manages squads, players, and challenges between squads.

### Structs

- **SquadFormation** and **ChallengeStatus** — Represent formation and challenge status.
- **Squad** — Squad details including name, owner, value, formation.
- **Player** — Player details linked to squad.
- **Challenge** — Challenge details including participants, wager, status, winner.

### Events

- `SquadCreated`, `PlayerCreated`, `ChallengeCreated`, `ChallengeCompleted`.

### Constants

- Formation types, status codes, error codes.

### Key Functions

- `create_squad`, `create_player`, `create_challenge`.
- `start_challenge`, `complete_challenge`, `cancel_challenge`.
- Getter functions and utility functions for string conversion.

---

## 6. Module: bullfy::oracle_interface

### Purpose
Interfaces with Pyth oracle price feeds for price data.

### Constants

- Price feed IDs for ETH/USD and BTC/USD.
- Maximum price age.

### Error Codes

- Invalid ID, stale price, negative price.

### Key Functions

- `get_eth_usd_price`, `get_btc_usd_price`.
- `get_price` (generic).
- `get_price_with_metadata`.
- `verify_price_feed_id`.

---

This documentation provides a detailed understanding of the Bullfy smart contracts, their data structures, logic, and events for developers and auditors.
