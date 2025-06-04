
module bullfy::squad_player_challenge {
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // Error constants
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
    #[error]
    const E_INSUFFICIENT_BID: vector<u8> = b"Bid amount is insufficient";
    #[error]
    const E_CHALLENGE_FULL: vector<u8> = b"Challenge has reached maximum participants";
    #[error]
    const E_ALREADY_JOINED: vector<u8> = b"Address has already joined this challenge";
    #[error]
    const E_INVALID_PARTICIPANT_COUNT: vector<u8> = b"Invalid number of participants specified";
    #[error]
    const E_INVALID_START_TIME: vector<u8> = b"Start time must be in the future";
    #[error]
    const E_CHALLENGE_NOT_STARTED: vector<u8> = b"Challenge has not started yet";
    #[error]
    const E_CHALLENGE_NOT_READY: vector<u8> = b"Challenge is not ready to start";
    #[error]
    const E_INVALID_BID_AMOUNT: vector<u8> = b"Bid amount must be greater than zero";
    #[error]
    const E_CHALLENGE_EXPIRED: vector<u8> = b"Challenge has expired";

    // Constants
    const MIN_PARTICIPANTS: u64 = 2;
    const MAX_PARTICIPANTS: u64 = 20;
    const MIN_BID_AMOUNT: u64 = 1000000; // 0.001 SUI (1 MIST = 1e-9 SUI, so 1e6 MIST = 0.001 SUI)
    const PLATFORM_FEE_BPS: u64 = 250; // 2.5% platform fee
    const MIN_DURATION: u64 = 300000; // 5 minutes in milliseconds
    const MAX_DURATION: u64 = 2592000000; // 30 days in milliseconds

    // Challenge status struct
    public struct ChallengeStatus has copy, drop, store {
        status_type: u8,
    }

    // Status constants
    const STATUS_SCHEDULED: u8 = 0;  // Future scheduled challenge
    const STATUS_PENDING: u8 = 1;    // Waiting for participants
    const STATUS_ACTIVE: u8 = 2;     // Currently running
    const STATUS_COMPLETED: u8 = 3;  // Finished with winner
    const STATUS_CANCELLED: u8 = 4;  // Cancelled/refunded

    // Main Challenge struct
    public struct Challenge has key, store {
        id: UID,
        creator: address,
        bid_amount: u64,                    // Required bid to join
        max_participants: u64,              // Maximum number of participants
        current_participants: u64,          // Current number of participants
        participants: vector<address>,      // List of participant addresses
        bid_pool: Balance<SUI>,            // Total bid pool
        participant_bids: Table<address, u64>, // Track individual bid amounts
        scheduled_start_time: u64,         // When challenge should start
        duration: u64,                     // Challenge duration in milliseconds
        actual_start_time: Option<u64>,    // When challenge actually started
        end_time: Option<u64>,             // When challenge ends
        winner: Option<address>,           // Winner of the challenge
        status: ChallengeStatus,           // Current status
        created_at: u64,                   // Creation timestamp
        updated_at: u64,                   // Last update timestamp
    }

    // Events
    public struct ChallengeCreated has copy, drop {
        challenge_id: ID,
        creator: address,
        bid_amount: u64,
        max_participants: u64,
        scheduled_start_time: u64,
        duration: u64,
    }

    public struct ParticipantJoined has copy, drop {
        challenge_id: ID,
        participant: address,
        bid_amount: u64,
        total_participants: u64,
        total_pool: u64,
    }

    public struct ChallengeStarted has copy, drop {
        challenge_id: ID,
        start_time: u64,
        end_time: u64,
        total_participants: u64,
        total_pool: u64,
    }

    public struct ChallengeCompleted has copy, drop {
        challenge_id: ID,
        winner: address,
        prize_amount: u64,
        platform_fee: u64,
    }

    public struct ChallengeCancelled has copy, drop {
        challenge_id: ID,
        reason: String,
        refund_amount: u64,
    }

    // Helper functions for status management
    public fun create_status(status_type: u8): ChallengeStatus {
        assert!(status_type <= 4, E_INVALID_STATUS_TYPE);
        ChallengeStatus { status_type }
    }

    public fun get_status_type(status: &ChallengeStatus): u8 {
        status.status_type
    }

    // Create a new challenge with future scheduling and bid requirements
    public entry fun create_challenge(
        bid_amount: u64,
        max_participants: u64,
        scheduled_start_time: u64,
        duration: u64,
        mut creator_bid: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate inputs
        assert!(bid_amount >= MIN_BID_AMOUNT, E_INVALID_BID_AMOUNT);
        assert!(max_participants >= MIN_PARTICIPANTS && max_participants <= MAX_PARTICIPANTS, E_INVALID_PARTICIPANT_COUNT);
        assert!(scheduled_start_time > current_time, E_INVALID_START_TIME);
        assert!(duration >= MIN_DURATION && duration <= MAX_DURATION, E_INVALID_START_TIME);
        
        // Validate creator's bid
        let creator_bid_amount = coin::value(&creator_bid);
        assert!(creator_bid_amount >= bid_amount, E_INSUFFICIENT_BID);

        // Handle creator's bid payment
        let actual_bid = if (creator_bid_amount == bid_amount) {
            creator_bid
        } else {
            // Split the exact bid amount and return change
            let change = coin::split(&mut creator_bid, creator_bid_amount - bid_amount, ctx);
            transfer::public_transfer(change, creator);
            creator_bid
        };

        // Create the challenge
        let mut challenge = Challenge {
            id: object::new(ctx),
            creator,
            bid_amount,
            max_participants,
            current_participants: 1, // Creator is first participant
            participants: vector::singleton(creator),
            bid_pool: coin::into_balance(actual_bid),
            participant_bids: table::new(ctx),
            scheduled_start_time,
            duration,
            actual_start_time: option::none(),
            end_time: option::none(),
            winner: option::none(),
            status: create_status(STATUS_SCHEDULED),
            created_at: current_time,
            updated_at: current_time,
        };

        // Record creator's bid
        table::add(&mut challenge.participant_bids, creator, bid_amount);

        let challenge_id = object::id(&challenge);

        // Emit creation event
        event::emit(ChallengeCreated {
            challenge_id,
            creator,
            bid_amount,
            max_participants,
            scheduled_start_time,
            duration,
        });

        // Share the challenge object
        transfer::share_object(challenge);
    }

    // Join an existing challenge by paying the required bid
    public entry fun join_challenge(
        challenge: &mut Challenge,
        mut participant_bid: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let participant = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate challenge state
        assert!(challenge.status.status_type == STATUS_SCHEDULED, E_CHALLENGE_NOT_PENDING);
        assert!(challenge.current_participants < challenge.max_participants, E_CHALLENGE_FULL);
        assert!(!vector::contains(&challenge.participants, &participant), E_ALREADY_JOINED);
        assert!(current_time < challenge.scheduled_start_time, E_CHALLENGE_EXPIRED);

        // Validate bid amount
        let participant_bid_amount = coin::value(&participant_bid);
        assert!(participant_bid_amount >= challenge.bid_amount, E_INSUFFICIENT_BID);

        // Handle bid payment
        let actual_bid = if (participant_bid_amount == challenge.bid_amount) {
            participant_bid
        } else {
            // Split the exact bid amount and return change
            let change = coin::split(&mut participant_bid, participant_bid_amount - challenge.bid_amount, ctx);
            transfer::public_transfer(change, participant);
            participant_bid
        };

        // Add participant to challenge
        vector::push_back(&mut challenge.participants, participant);
        challenge.current_participants = challenge.current_participants + 1;
        
        // Add bid to pool
        balance::join(&mut challenge.bid_pool, coin::into_balance(actual_bid));
        
        // Record participant's bid
        table::add(&mut challenge.participant_bids, participant, challenge.bid_amount);
        
        // Update timestamp
        challenge.updated_at = current_time;

        // Emit join event
        event::emit(ParticipantJoined {
            challenge_id: object::id(challenge),
            participant,
            bid_amount: challenge.bid_amount,
            total_participants: challenge.current_participants,
            total_pool: balance::value(&challenge.bid_pool),
        });
    }

    // Start a scheduled challenge when the time comes
    public entry fun start_challenge(
        challenge: &mut Challenge,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate authorization (creator or any participant can start)
        assert!(vector::contains(&challenge.participants, &sender), E_UNAUTHORIZED);
        
        // Validate challenge state
        assert!(challenge.status.status_type == STATUS_SCHEDULED, E_CHALLENGE_NOT_PENDING);
        assert!(current_time >= challenge.scheduled_start_time, E_CHALLENGE_NOT_STARTED);
        assert!(challenge.current_participants >= MIN_PARTICIPANTS, E_CHALLENGE_NOT_READY);

        // Update challenge status
        challenge.status = create_status(STATUS_ACTIVE);
        challenge.actual_start_time = option::some(current_time);
        challenge.end_time = option::some(current_time + challenge.duration);
        challenge.updated_at = current_time;

        // Emit start event
        event::emit(ChallengeStarted {
            challenge_id: object::id(challenge),
            start_time: current_time,
            end_time: current_time + challenge.duration,
            total_participants: challenge.current_participants,
            total_pool: balance::value(&challenge.bid_pool),
        });
    }

    // Complete a challenge and distribute prizes
    public entry fun complete_challenge(
        challenge: &mut Challenge,
        winner: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate authorization (only creator can complete for now)
        assert!(sender == challenge.creator, E_UNAUTHORIZED);
        
        // Validate challenge state
        assert!(challenge.status.status_type == STATUS_ACTIVE, E_CHALLENGE_ALREADY_COMPLETED);
        assert!(vector::contains(&challenge.participants, &winner), E_INVALID_SQUAD_ID);

        // Calculate prize distribution
        let total_pool = balance::value(&challenge.bid_pool);
        let platform_fee = (total_pool * PLATFORM_FEE_BPS) / 10000;
        let winner_prize = total_pool - platform_fee;

        // Update challenge status
        challenge.status = create_status(STATUS_COMPLETED);
        challenge.winner = option::some(winner);
        challenge.updated_at = current_time;

        // Distribute prizes
        if (winner_prize > 0) {
            let winner_coin = coin::from_balance(
                balance::split(&mut challenge.bid_pool, winner_prize),
                ctx
            );
            transfer::public_transfer(winner_coin, winner);
        };

        // Platform fee handling (kept in challenge for now, could be sent to fee collector)
        
        // Emit completion event
        event::emit(ChallengeCompleted {
            challenge_id: object::id(challenge),
            winner,
            prize_amount: winner_prize,
            platform_fee,
        });
    }

    // Cancel a challenge and refund participants
    public entry fun cancel_challenge(
        challenge: &mut Challenge,
        reason: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate authorization (only creator can cancel)
        assert!(sender == challenge.creator, E_UNAUTHORIZED);
        
        // Validate challenge state (can cancel if scheduled or active)
        assert!(
            challenge.status.status_type == STATUS_SCHEDULED || 
            challenge.status.status_type == STATUS_ACTIVE, 
            E_CHALLENGE_ALREADY_COMPLETED
        );

        // Update status
        challenge.status = create_status(STATUS_CANCELLED);
        challenge.updated_at = current_time;

        // Refund all participants
        let total_refund = balance::value(&challenge.bid_pool);
        refund_participants(challenge, ctx);

        // Emit cancellation event
        event::emit(ChallengeCancelled {
            challenge_id: object::id(challenge),
            reason,
            refund_amount: total_refund,
        });
    }

    // Helper function to refund all participants
    fun refund_participants(challenge: &mut Challenge, ctx: &mut TxContext) {
        let mut i = 0;
        while (i < vector::length(&challenge.participants)) {
            let participant = *vector::borrow(&challenge.participants, i);
            let bid_amount = *table::borrow(&challenge.participant_bids, participant);
            
            if (bid_amount > 0) {
                let refund_coin = coin::from_balance(
                    balance::split(&mut challenge.bid_pool, bid_amount),
                    ctx
                );
                transfer::public_transfer(refund_coin, participant);
            };
            
            i = i + 1;
        };
    }

    // Auto-expire challenge if it hasn't started after scheduled time + grace period
    public entry fun expire_challenge(
        challenge: &mut Challenge,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        let grace_period = 3600000; // 1 hour grace period
        
        assert!(challenge.status.status_type == STATUS_SCHEDULED, E_CHALLENGE_NOT_PENDING);
        assert!(current_time > challenge.scheduled_start_time + grace_period, E_CHALLENGE_NOT_STARTED);

        // Cancel and refund
        challenge.status = create_status(STATUS_CANCELLED);
        challenge.updated_at = current_time;
        
        refund_participants(challenge, ctx);

        event::emit(ChallengeCancelled {
            challenge_id: object::id(challenge),
            reason: string::utf8(b"Expired - not started within grace period"),
            refund_amount: balance::value(&challenge.bid_pool),
        });
    }

    // Getter functions
    public fun get_challenge_info(challenge: &Challenge): (
        address,           // creator
        u64,              // bid_amount
        u64,              // max_participants
        u64,              // current_participants
        u64,              // scheduled_start_time
        u64,              // duration
        Option<address>,  // winner
        u8,               // status
        u64               // total_pool
    ) {
        (
            challenge.creator,
            challenge.bid_amount,
            challenge.max_participants,
            challenge.current_participants,
            challenge.scheduled_start_time,
            challenge.duration,
            challenge.winner,
            challenge.status.status_type,
            balance::value(&challenge.bid_pool)
        )
    }

    public fun get_participants(challenge: &Challenge): &vector<address> {
        &challenge.participants
    }

    public fun get_participant_bid(challenge: &Challenge, participant: address): u64 {
        if (table::contains(&challenge.participant_bids, participant)) {
            *table::borrow(&challenge.participant_bids, participant)
        } else {
            0
        }
    }

    public fun is_participant(challenge: &Challenge, address: address): bool {
        vector::contains(&challenge.participants, &address)
    }

    public fun get_time_until_start(challenge: &Challenge, clock: &Clock): u64 {
        let current_time = clock::timestamp_ms(clock);
        if (current_time >= challenge.scheduled_start_time) {
            0
        } else {
            challenge.scheduled_start_time - current_time
        }
    }

    // Utility function to convert status to readable string
    public fun status_to_string(status: &ChallengeStatus): String {
        if (status.status_type == STATUS_SCHEDULED) {
            string::utf8(b"Scheduled")
        } else if (status.status_type == STATUS_PENDING) {
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