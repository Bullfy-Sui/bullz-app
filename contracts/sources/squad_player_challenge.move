
module bullfy::squad_player_challenge {
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};
    // Error messages using Move 2024 #[error] attribute
   // #[error]
   // const E_INVALID_CHALLENGE_STATUS: vector<u8> = b"Invalid challenge status provided";
    #[error]
    const E_INVALID_SQUAD_ID: vector<u8> = b"Invalid squad ID for the challenge";
    #[error]
    const E_UNAUTHORIZED: vector<u8> = b"Sender is not authorized to perform this action";
    #[error]
    const E_CHALLENGE_NOT_PENDING: vector<u8> = b"Challenge is not in a pending state";
    #[error]
    const E_CHALLENGE_ALREADY_COMPLETED: vector<u8> = b"Challenge has already been completed or cancelled";
    #[error]
    const E_INVALID_STATUS_TYPE: vector<u8> = b"Invalid status type for ChallengeStatus creation";

    // Challenge status struct instead of enum
    public struct ChallengeStatus has copy, drop, store {
        status_type: u8,
    }

    // Status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_ACTIVE: u8 = 1;
    const STATUS_COMPLETED: u8 = 2;
    const STATUS_CANCELLED: u8 = 3;

    public struct Challenge has key, store {
        id: UID,
        squad_owners: vector<address>, // Use addresses instead of UIDs
        duration: u64,
        creator: address,
        winner: Option<address>,
        wager_amount: u64,
        status: ChallengeStatus,
        start_time: u64,
        end_time: Option<u64>,
        created_at: u64,
        updated_at: u64,
    }

  

   
    public struct ChallengeCreated has copy, drop {
        challenge_id: ID,
        creator: address,
        squad_owners: vector<address>,
        wager_amount: u64,
    }

    public struct ChallengeCompleted has copy, drop {
        challenge_id: ID,
        winner: address,
    }

    // Helper functions
    public fun create_status(status_type: u8): ChallengeStatus {
        assert!(status_type <= 3, E_INVALID_STATUS_TYPE);
        ChallengeStatus { status_type }
    }

    public fun get_status_type(status: &ChallengeStatus): u8 {
        status.status_type
    }

    public entry fun create_challenge(
        squad_owners: vector<address>,
        duration: u64,
        wager_amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate that creator is one of the squad owners
        assert!(vector::contains(&squad_owners, &creator), E_UNAUTHORIZED);

        let challenge = Challenge {
            id: object::new(ctx),
            squad_owners,
            duration,
            creator,
            winner: option::none(),
            wager_amount,
            status: create_status(STATUS_PENDING),
            start_time: current_time,
            end_time: option::none(),
            created_at: current_time,
            updated_at: current_time,
        };

        let challenge_id = object::id(&challenge);

        event::emit(ChallengeCreated {
            challenge_id,
            creator,
            squad_owners: challenge.squad_owners,
            wager_amount,
        });

        transfer::share_object(challenge);
    }

    public entry fun start_challenge(
        challenge: &mut Challenge,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == challenge.creator, E_UNAUTHORIZED);
        assert!(challenge.status.status_type == STATUS_PENDING, E_CHALLENGE_NOT_PENDING);

        let current_time = clock::timestamp_ms(clock);
        challenge.status = create_status(STATUS_ACTIVE);
        challenge.start_time = current_time;
        challenge.end_time = option::some(current_time + challenge.duration);
        challenge.updated_at = current_time;
    }

    public entry fun complete_challenge(
        challenge: &mut Challenge,
        winner: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == challenge.creator, E_UNAUTHORIZED);
        assert!(challenge.status.status_type == STATUS_ACTIVE, E_CHALLENGE_ALREADY_COMPLETED);
        assert!(vector::contains(&challenge.squad_owners, &winner), E_INVALID_SQUAD_ID);

        let current_time = clock::timestamp_ms(clock);
        challenge.status = create_status(STATUS_COMPLETED);
        challenge.winner = option::some(winner);
        challenge.updated_at = current_time;

        event::emit(ChallengeCompleted {
            challenge_id: object::id(challenge),
            winner,
        });
    }

    public entry fun cancel_challenge(
        challenge: &mut Challenge,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == challenge.creator, E_UNAUTHORIZED);
        assert!(challenge.status.status_type == STATUS_PENDING || challenge.status.status_type == STATUS_ACTIVE, E_CHALLENGE_ALREADY_COMPLETED);

        let current_time = clock::timestamp_ms(clock);
        challenge.status = create_status(STATUS_CANCELLED);
        challenge.updated_at = current_time;
    }

    // Getter functions
    public fun get_challenge_info(challenge: &Challenge): (vector<address>, address, Option<address>, u64, u8) {
        (challenge.squad_owners, challenge.creator, challenge.winner, challenge.wager_amount, challenge.status.status_type)
    }

    // Utility function to convert status to readable string
    public fun status_to_string(status: &ChallengeStatus): String {
        if (status.status_type == STATUS_PENDING) {
            string::utf8(b"Pending")
        } else if (status.status_type == STATUS_ACTIVE) {
            string::utf8(b"Active")
        } else if (status.status_type == STATUS_COMPLETED) {
            string::utf8(b"Completed")
        } else if (status.status_type == STATUS_CANCELLED) {
            string::utf8(b"Cancelled")
        } else {
            string::utf8(b"Unknown")
        }
    }
}