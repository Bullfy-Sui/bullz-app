# Match Signer Module Usage

The `match_signer` module provides a specialized capability system for backend services to automatically complete matches and claim prizes. The existing `complete_match` and `claim_prize` functions now use `MatchSignerCap` instead of `AdminCap`.

## Overview

The Match Signer system allows you to:
- Create specific capabilities for backend services
- Automatically complete matches when they end using the existing `complete_match()` function
- Automatically claim prizes for winners using the existing `claim_prize()` function
- Manage and revoke signer permissions
- Track all active signers

## Key Components

### MatchSignerCap
A capability that allows backend services to:
- Complete matches using `complete_match()`
- Claim prizes using `claim_prize()`

### SignerRegistry
A shared object that tracks all active signers and their status.

## Setup Process

### 1. Deploy the Module
The `match_signer` module will be deployed automatically with your contract and create a `SignerRegistry` shared object.

### 2. Create a Signer Capability

**Using AdminCap:**
```move
// Create a new match signer capability
public entry fun create_match_signer(
    admin_cap: &AdminCap,
    registry: &mut SignerRegistry,
    signer_address: address, // Address of your backend service
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Using OwnerCap (for initial setup):**
```move
// Create a new match signer capability with owner privileges
public entry fun create_match_signer_with_owner(
    owner_cap: &OwnerCap,
    registry: &mut SignerRegistry,
    signer_address: address, // Address of your backend service
    clock: &Clock,
    ctx: &mut TxContext
)
```

### 3. Backend Service Usage

Your backend service can now use the `MatchSignerCap` with the existing functions:

**Complete a match:**
```move
public entry fun complete_match(
    signer_cap: &MatchSignerCap,
    registry: &mut EscrowRegistry,
    squad_registry: &mut SquadRegistry,
    active_squad_registry: &mut ActiveSquadRegistry,
    match_id: ID,
    winner: address,
    squad1_final_token_prices: vector<u64>,
    squad2_final_token_prices: vector<u64>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Claim prize for winner:**
```move
public entry fun claim_prize(
    signer_cap: &MatchSignerCap,
    registry: &mut EscrowRegistry,
    fees: &mut Fees,
    match_id: ID,
    ctx: &mut TxContext
)
```

## Management Functions

### Revoke Signer Access
```move
// Revoke using AdminCap
public entry fun revoke_match_signer(
    admin_cap: &AdminCap,
    registry: &mut SignerRegistry,
    signer_cap: MatchSignerCap,
    clock: &Clock,
    ctx: &mut TxContext
)

// Revoke using OwnerCap
public entry fun revoke_match_signer_with_owner(
    owner_cap: &OwnerCap,
    registry: &mut SignerRegistry,
    signer_cap: MatchSignerCap,
    clock: &Clock,
    ctx: &mut TxContext
)
```

### Temporarily Deactivate/Reactivate
```move
// Signer can deactivate themselves
public entry fun deactivate_signer(
    signer_cap: &mut MatchSignerCap,
    clock: &Clock,
    ctx: &mut TxContext
)

// Signer can reactivate themselves
public entry fun reactivate_signer(
    signer_cap: &mut MatchSignerCap,
    clock: &Clock,
    ctx: &mut TxContext
)
```

## Query Functions

### Check Signer Status
```move
// Check if address is an active signer
public fun is_active_signer(registry: &SignerRegistry, signer_address: address): bool

// Get all active signers
public fun get_active_signers(registry: &SignerRegistry): &vector<address>

// Get signer count
public fun get_signer_count(registry: &SignerRegistry): u64

// Get signer information
public fun get_signer_info(signer_cap: &MatchSignerCap): (address, u64, bool)
```

## Security Features

1. **Authorization Validation**: Each signer operation validates that the caller owns the capability and it's active
2. **Separate Permissions**: Signers can only complete matches and claim prizes, not perform other admin functions
3. **Tracking**: All signer activities are tracked and can be monitored
4. **Revocation**: Signers can be revoked at any time by admins
5. **Self-Management**: Signers can temporarily deactivate themselves

## Backend Integration

Your backend service should:

1. **Monitor Matches**: Check for matches that have ended using `has_match_ended()`
2. **Complete Matches**: Call `complete_match()` when a match ends
3. **Claim Prizes**: Call `claim_prize()` to distribute prizes to winners
4. **Handle Errors**: Implement proper error handling for unauthorized or invalid operations

## Events

The module emits the following events for monitoring:
- `MatchSignerCreated`: When a new signer is created
- `MatchSignerRevoked`: When a signer is revoked
- `MatchSignerDeactivated`: When a signer deactivates themselves
- `MatchSignerReactivated`: When a signer reactivates themselves

## Best Practices

1. **Limit Signers**: Only create signer capabilities for trusted backend services
2. **Monitor Activity**: Track signer events to detect unusual activity
3. **Regular Rotation**: Consider rotating signer capabilities periodically
4. **Backup Signers**: Have multiple backend services with signer capabilities for redundancy
5. **Test Thoroughly**: Test all signer functions in a development environment first

## Migration Notes

**BREAKING CHANGE**: The `complete_match` and `claim_prize` functions now require `MatchSignerCap` instead of `AdminCap`. 

If you have existing admin workflows that use these functions with `AdminCap`, you'll need to:
1. Create a `MatchSignerCap` for your admin operations
2. Update your function calls to use the `MatchSignerCap`

This change provides better security by separating match completion permissions from general admin permissions. 