# Challenge Privacy Features Demo

## Overview

The challenge system now supports **private vs public challenges** with granular access control.

## New Features

### 1. Challenge Privacy Types

```move
public enum ChallengePrivacy has copy, drop, store {
    Public,     // Anyone can join
    Private,    // Only invited participants can join
}
```

### 2. Creating Challenges

#### Public Challenge (Default)
```move
entry fun create_challenge(
    squad_registry: &SquadRegistry,
    active_squad_registry: &mut ActiveSquadRegistry,
    fee_config: &FeeConfig,
    creator_squad_id: u64,
    bid_amount: u64,
    max_participants: u64,
    scheduled_start_time: u64,
    duration: u64,
    is_private: false,  // 🔓 Public challenge
    creator_bid: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### Private Challenge
```move
entry fun create_challenge(
    // ... same parameters ...
    is_private: true,   // 🔒 Private challenge
    // ... rest of parameters ...
)
```

### 3. Managing Private Challenge Access

#### ➕ ADD Single Participant (ALLOWS them to join)
```move
entry fun allow_participant(
    challenge: &mut Challenge,
    participant_to_allow: address,  // ➕ This address will be ADDED to allowed list
    clock: &Clock,
    ctx: &TxContext
)
```

#### ➕ ADD Multiple Participants (ALLOWS them to join)
```move
entry fun allow_multiple_participants(
    challenge: &mut Challenge,
    participants_to_allow: vector<address>,  // ➕ These addresses will be ADDED to allowed list
    clock: &Clock,
    ctx: &TxContext
)
```

#### ➖ REMOVE Participant Permission (BLOCKS them from joining)
```move
entry fun disallow_participant(
    challenge: &mut Challenge,
    participant_to_remove: address,  // ➖ This address will be REMOVED from allowed list
    clock: &Clock,
    ctx: &TxContext
)
```

## Function Summary (Clear Naming)

| Function | Action | Purpose |
|----------|---------|---------|
| `allow_participant` | ➕ **ADDS** single address | Gives permission to join private challenge |
| `allow_multiple_participants` | ➕ **ADDS** multiple addresses | Gives permission to multiple users at once |
| `disallow_participant` | ➖ **REMOVES** single address | Revokes permission to join private challenge |

### 4. Privacy Validation

The `join_challenge` function now includes privacy checks:

```move
// NEW: Check privacy permissions
if (challenge.privacy == ChallengePrivacy::Private) {
    // For private challenges, participant must be in allowed list or be the creator
    assert!(
        participant == challenge.creator || 
        vector::contains(&challenge.allowed_participants, &participant),
        EPrivateChallengeNotAllowed
    );
};
```

### 5. Utility Functions

#### Check Challenge Privacy
```move
public fun is_private_challenge(challenge: &Challenge): bool
public fun is_public_challenge(challenge: &Challenge): bool
public fun get_privacy_string(challenge: &Challenge): String
```

#### Participant Management
```move
public fun is_participant_allowed(challenge: &Challenge, participant: address): bool
public fun get_allowed_participants(challenge: &Challenge): &vector<address>
public fun get_allowed_participants_count(challenge: &Challenge): u64
public fun can_participant_join(challenge: &Challenge, participant: address): bool
```

## Usage Examples

### Example 1: Create Private Tournament
```typescript
// Frontend example
const createPrivateChallenge = async () => {
    const tx = new TransactionBlock();
    
    tx.moveCall({
        target: `${PACKAGE_ID}::squad_player_challenge::create_challenge`,
        arguments: [
            tx.object(SQUAD_REGISTRY_ID),
            tx.object(ACTIVE_SQUAD_REGISTRY_ID),
            tx.object(FEE_CONFIG_ID),
            tx.pure(squadId),
            tx.pure(bidAmount),
            tx.pure(maxParticipants),
            tx.pure(scheduledStartTime),
            tx.pure(duration),
            tx.pure(true), // 🔒 Private challenge
            tx.object(bidCoin),
            tx.object(CLOCK_ID),
        ],
    });
    
    await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
    });
};
```

### Example 2: ➕ ADD/Invite Participants (Give Permission)
```typescript
// ADD single participant
const inviteSinglePlayer = async (challengeId: string, playerAddress: string) => {
    const tx = new TransactionBlock();
    
    tx.moveCall({
        target: `${PACKAGE_ID}::squad_player_challenge::allow_participant`,
        arguments: [
            tx.object(challengeId),
            tx.pure(playerAddress), // ➕ This player will be ADDED to allowed list
            tx.object(CLOCK_ID),
        ],
    });
    
    await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
    });
};

// ADD multiple participants
const inviteMultiplePlayers = async (challengeId: string, playerAddresses: string[]) => {
    const tx = new TransactionBlock();
    
    tx.moveCall({
        target: `${PACKAGE_ID}::squad_player_challenge::allow_multiple_participants`,
        arguments: [
            tx.object(challengeId),
            tx.pure(playerAddresses), // ➕ These players will be ADDED to allowed list
            tx.object(CLOCK_ID),
        ],
    });
    
    await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
    });
};
```

### Example 3: ➖ REMOVE/Kick Participants (Revoke Permission)
```typescript
// REMOVE participant permission
const kickPlayer = async (challengeId: string, playerAddress: string) => {
    const tx = new TransactionBlock();
    
    tx.moveCall({
        target: `${PACKAGE_ID}::squad_player_challenge::disallow_participant`,
        arguments: [
            tx.object(challengeId),
            tx.pure(playerAddress), // ➖ This player will be REMOVED from allowed list
            tx.object(CLOCK_ID),
        ],
    });
    
    await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
    });
};
```

### Example 4: Check if User Can Join
```typescript
const canUserJoin = async (challengeId: string, userAddress: string) => {
    const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
    });
    
    // Parse result to check if user can join
    return result.effects.status.status === 'success';
};
```

## Security Features

### 1. Access Control
- ✅ Only challenge creator can manage allowed participants
- ✅ Private challenges require explicit permission
- ✅ Cannot modify allowed list after challenge starts

### 2. Error Handling
- `EPrivateChallengeNotAllowed` - Participant not allowed in private challenge
- `ENotChallengeCreator` - Only creator can manage participants
- `EAlreadyInAllowedList` - Participant already allowed
- `ENotInAllowedList` - Participant not in allowed list

### 3. Events
- `ParticipantAllowed` - Participant ➕ **ADDED** to allowed list
- `ParticipantDisallowed` - Participant ➖ **REMOVED** from allowed list
- `ChallengeCreated` - Includes privacy type in event

## Benefits

1. **🔒 Privacy Control**: Creators can restrict who joins their challenges
2. **👥 Exclusive Tournaments**: Perfect for private tournaments between friends
3. **🎯 Targeted Competitions**: Invite specific skilled players
4. **🛡️ Security**: Prevents unwanted participants from joining expensive challenges
5. **📊 Analytics**: Track private vs public challenge engagement

## Next Steps

The privacy system is now ready for:
- Frontend integration
- Testing with real users
- Additional privacy features (e.g., hidden challenge details)
- Integration with user reputation systems 