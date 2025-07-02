module bullfy::squad_player_challenge {
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use bullfy::squad_manager::SquadRegistry;
    use bullfy::fee_collector::{Self, Fees};
    use bullfy::admin::{Self, FeeConfig};
    use bullfy::validators;
    use bullfy::payment_utils;
    use bullfy::fee_calculator;

    // Error constants (module-specific only)
    const EUnauthorized: u64 = 2001;
    const EChallengeNotScheduled: u64 = 2002;
    const EChallengeAlreadyCompleted: u64 = 2003;
    const EChallengeFull: u64 = 2004;
    const EAlreadyJoined: u64 = 2005;
    const EInvalidParticipantCount: u64 = 2006;
    const EInvalidStartTime: u64 = 2007;
    const EChallengeNotStarted: u64 = 2008;
    const EChallengeNotReady: u64 = 2009;
    const EChallengeExpired: u64 = 2010;
    const EInvalidWinner: u64 = 2011;
    const ESquadAlreadyUsed: u64 = 2012;
    const ESquadActiveInChallenge: u64 = 2013;
    const EInsufficientBid: u64 = 2014;

    // Constants
    const MIN_PARTICIPANTS: u64 = 2;
    const MIN_BID_AMOUNT: u64 = 1_000_000; // 0.001 SUI 
    const MIN_DURATION: u64 = 300_000; // 5 minutes in milliseconds
    const MAX_DURATION: u64 = 2_592_000_000; // 30 days in milliseconds

    // Challenge status enum
    public enum ChallengeStatus has copy, drop, store {
        Scheduled,  
        Active,     
        Completed,  
        Cancelled, 
    }

    // Global registry to track which squads are active in challenges
    public struct ActiveSquadRegistry has key {
        id: UID,
        // Maps squad_id to challenge_id for active challenges
        active_squads: Table<u64, ID>,
    }

    // Main Challenge struct
    public struct Challenge has key, store {
        id: UID,
        creator: address,
        bid_amount: u64,                    // Required bid to join
        max_participants: u64,              // Maximum number of participants
        current_participants: u64,          // Current number of participants
        participants: vector<address>,      // List of participant addresses
        participant_squads: Table<address, u64>, // Track which squad each participant is using
        bid_pool: Balance<SUI>,            // Total bid pool (excluding fees)
        fee_vault: Balance<SUI>,           // Collected upfront fees (5% of each bid)
        participant_bids: Table<address, u64>, // Track individual bid amounts
        participant_fees: Table<address, u64>, // Track individual fee amounts
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
        creator_squad_id: u64,
        bid_amount: u64,
        max_participants: u64,
        scheduled_start_time: u64,
        duration: u64,
    }

    public struct ParticipantJoined has copy, drop {
        challenge_id: ID,
        participant: address,
        squad_id: u64,
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
    }

    public struct ChallengeCancelled has copy, drop {
        challenge_id: ID,
        reason: String,
        refund_amount: u64,
    }

    public struct SquadRegisteredInChallenge has copy, drop {
        squad_id: u64,
        challenge_id: ID,
        participant: address,
    }

    public struct SquadUnregisteredFromChallenge has copy, drop {
        squad_id: u64,
        challenge_id: ID,
        participant: address,
    }

    public struct FeeCollected has copy, drop {
        challenge_id: ID,
        participant: address,
        bid_amount: u64,
        fee_amount: u64,
        total_payment: u64,
    }

    public struct FeesTransferredToCollector has copy, drop {
        challenge_id: ID,
        total_fees: u64,
        upfront_fees: u64,
    }

    public struct FeesRefunded has copy, drop {
        challenge_id: ID,
        total_fees_refunded: u64,
        participant_count: u64,
    }

    // Initialize the active squad registry
    fun init(ctx: &mut TxContext) {
        let registry = ActiveSquadRegistry {
            id: object::new(ctx),
            active_squads: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    // Create a new challenge with future scheduling and bid requirements
    public entry fun create_challenge(
        squad_registry: &SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        fee_config: &FeeConfig,
        creator_squad_id: u64,
        bid_amount: u64,
        max_participants: u64,
        scheduled_start_time: u64,
        duration: u64,
        creator_bid: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate squad ownership and status using common validator
        validators::validate_squad_ownership_and_life(squad_registry, creator_squad_id, creator);

        // Check if squad is already active in another challenge
        assert!(!table::contains(&active_squad_registry.active_squads, creator_squad_id), ESquadActiveInChallenge);

        // Validate inputs using common validators
        validators::validate_bid_amount(bid_amount, MIN_BID_AMOUNT);
        assert!(max_participants >= MIN_PARTICIPANTS, EInvalidParticipantCount);
        assert!(scheduled_start_time > current_time, EInvalidStartTime);
        validators::validate_duration(duration, MIN_DURATION, MAX_DURATION);
        
        // Calculate required payment using fee calculator
        let (fee_amount, total_required) = fee_calculator::calculate_upfront_fee(bid_amount, fee_config);
        
        // Validate creator's bid
        let creator_bid_amount = coin::value(&creator_bid);
        assert!(creator_bid_amount >= total_required, EInsufficientBid);

        // Handle creator's payment using common payment utils
        let (actual_bid, fee_payment) = payment_utils::handle_payment_with_fee(
            creator_bid,
            bid_amount,
            fee_amount,
            creator,
            ctx
        );

        // Create the challenge
        let mut challenge = Challenge {
            id: object::new(ctx),
            creator,
            bid_amount,
            max_participants,
            current_participants: 1, // Creator is first participant
            participants: vector::singleton(creator),
            participant_squads: table::new(ctx),
            bid_pool: coin::into_balance(actual_bid),
            fee_vault: coin::into_balance(fee_payment),
            participant_bids: table::new(ctx),
            participant_fees: table::new(ctx),
            scheduled_start_time,
            duration,
            actual_start_time: option::none(),
            end_time: option::none(),
            winner: option::none(),
            status: ChallengeStatus::Scheduled,
            created_at: current_time,
            updated_at: current_time,
        };

        let challenge_id = object::id(&challenge);

        // Record creator's bid and squad
        table::add(&mut challenge.participant_bids, creator, bid_amount);
        table::add(&mut challenge.participant_fees, creator, fee_amount);
        table::add(&mut challenge.participant_squads, creator, creator_squad_id);

        // Register squad as active in this challenge
        table::add(&mut active_squad_registry.active_squads, creator_squad_id, challenge_id);

        // Emit fee collection event
        event::emit(FeeCollected {
            challenge_id,
            participant: creator,
            bid_amount,
            fee_amount,
            total_payment: total_required,
        });

        // Emit squad registration event
        event::emit(SquadRegisteredInChallenge {
            squad_id: creator_squad_id,
            challenge_id,
            participant: creator,
        });

        // Emit creation event
        event::emit(ChallengeCreated {
            challenge_id,
            creator,
            creator_squad_id,
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
        squad_registry: &SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        fee_config: &FeeConfig,
        challenge: &mut Challenge,
        participant_squad_id: u64,
        participant_bid: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let participant = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate squad ownership and status using common validator
        validators::validate_squad_ownership_and_life(squad_registry, participant_squad_id, participant);

        // Check if squad is already active in another challenge
        assert!(!table::contains(&active_squad_registry.active_squads, participant_squad_id), ESquadActiveInChallenge);

        // Check if this squad is already being used in this challenge
        let mut i = 0;
        while (i < vector::length(&challenge.participants)) {
            let existing_participant = *vector::borrow(&challenge.participants, i);
            let existing_squad_id = *table::borrow(&challenge.participant_squads, existing_participant);
            assert!(existing_squad_id != participant_squad_id, ESquadAlreadyUsed);
            i = i + 1;
        };

        // Validate challenge state
        assert!(challenge.status == ChallengeStatus::Scheduled, EChallengeNotScheduled);
        assert!(challenge.current_participants < challenge.max_participants, EChallengeFull);
        assert!(!vector::contains(&challenge.participants, &participant), EAlreadyJoined);
        assert!(current_time < challenge.scheduled_start_time, EChallengeExpired);

        // Calculate required payment using fee calculator
        let (fee_amount, total_required) = fee_calculator::calculate_upfront_fee(challenge.bid_amount, fee_config);
        
        // Validate bid amount
        let participant_bid_amount = coin::value(&participant_bid);
        assert!(participant_bid_amount >= total_required, EInsufficientBid);

        // Handle participant's payment using common payment utils
        let (actual_bid, fee_payment) = payment_utils::handle_payment_with_fee(
            participant_bid,
            challenge.bid_amount,
            fee_amount,
            participant,
            ctx
        );

        // Add participant to challenge
        vector::push_back(&mut challenge.participants, participant);
        challenge.current_participants = challenge.current_participants + 1;
        
        // Add bid to pool and fee to vault
        balance::join(&mut challenge.bid_pool, coin::into_balance(actual_bid));
        balance::join(&mut challenge.fee_vault, coin::into_balance(fee_payment));
        
        // Record participant's bid, fee, and squad
        table::add(&mut challenge.participant_bids, participant, challenge.bid_amount);
        table::add(&mut challenge.participant_fees, participant, fee_amount);
        table::add(&mut challenge.participant_squads, participant, participant_squad_id);

        // Register squad as active in this challenge
        table::add(&mut active_squad_registry.active_squads, participant_squad_id, object::id(challenge));

        // Emit fee collection event
        event::emit(FeeCollected {
            challenge_id: object::id(challenge),
            participant,
            bid_amount: challenge.bid_amount,
            fee_amount,
            total_payment: total_required,
        });

        // Emit squad registration event
        event::emit(SquadRegisteredInChallenge {
            squad_id: participant_squad_id,
            challenge_id: object::id(challenge),
            participant,
        });
        
        // Update timestamp
        challenge.updated_at = current_time;

        // Emit join event
        event::emit(ParticipantJoined {
            challenge_id: object::id(challenge),
            participant,
            squad_id: participant_squad_id,
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
        assert!(vector::contains(&challenge.participants, &sender), EUnauthorized);
        
        // Validate challenge state
        assert!(challenge.status == ChallengeStatus::Scheduled, EChallengeNotScheduled);
        assert!(current_time >= challenge.scheduled_start_time, EChallengeNotStarted);
        assert!(challenge.current_participants >= MIN_PARTICIPANTS, EChallengeNotReady);

        // Update challenge status
        challenge.status = ChallengeStatus::Active;
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

    // Helper function to remove all squads from active registry
    fun remove_squads_from_active_registry(active_squad_registry: &mut ActiveSquadRegistry, challenge: &Challenge) {
        let mut i = 0;
        let challenge_id = object::id(challenge);
        while (i < vector::length(&challenge.participants)) {
            let participant = *vector::borrow(&challenge.participants, i);
            let squad_id = *table::borrow(&challenge.participant_squads, participant);
            if (table::contains(&active_squad_registry.active_squads, squad_id)) {
                table::remove(&mut active_squad_registry.active_squads, squad_id);
                
                // Emit squad unregistration event
                event::emit(SquadUnregisteredFromChallenge {
                    squad_id,
                    challenge_id,
                    participant,
                });
            };
            i = i + 1;
        };
    }

    // Complete a challenge and distribute prizes
    public entry fun complete_challenge(
        active_squad_registry: &mut ActiveSquadRegistry,
        challenge: &mut Challenge,
        fees: &mut Fees,
        winner: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate authorization (only creator can complete for now)
        assert!(sender == challenge.creator, EUnauthorized);
        
        // Validate challenge state
        assert!(challenge.status == ChallengeStatus::Active, EChallengeAlreadyCompleted);
        assert!(vector::contains(&challenge.participants, &winner), EInvalidWinner);

        // Calculate prize distribution
        let total_pool = balance::value(&challenge.bid_pool);
        let collected_fees = balance::value(&challenge.fee_vault);

        // Update challenge status
        challenge.status = ChallengeStatus::Completed;
        challenge.winner = option::some(winner);
        challenge.updated_at = current_time;

        // Remove all squads from active registry
        remove_squads_from_active_registry(active_squad_registry, challenge);

        // Distribute prizes
        if (total_pool > 0) {
            let winner_coin = coin::from_balance(
                balance::split(&mut challenge.bid_pool, total_pool),
                ctx
            );
            transfer::public_transfer(winner_coin, winner);
        };

        // Transfer collected upfront fees to fee collector
        if (collected_fees > 0) {
            let upfront_fees_coin = coin::from_balance(
                balance::split(&mut challenge.fee_vault, collected_fees),
                ctx
            );
            fee_collector::collect(fees, upfront_fees_coin, ctx);
        };
        
        // Emit fees transferred event if any fees were collected
        if (collected_fees > 0) {
            event::emit(FeesTransferredToCollector {
                challenge_id: object::id(challenge),
                total_fees: collected_fees,
                upfront_fees: collected_fees,
            });
        };

        // Emit completion event
        event::emit(ChallengeCompleted {
            challenge_id: object::id(challenge),
            winner,
            prize_amount: total_pool,
        });
    }

    // Cancel a challenge and refund participants
    public entry fun cancel_challenge(
        active_squad_registry: &mut ActiveSquadRegistry,
        challenge: &mut Challenge,
        reason: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate authorization (only creator can cancel)
        assert!(sender == challenge.creator, EUnauthorized);
        
        // Validate challenge state (can cancel if scheduled or active)
        assert!(
            challenge.status == ChallengeStatus::Scheduled || 
            challenge.status == ChallengeStatus::Active, 
            EChallengeAlreadyCompleted
        );

        // Update status
        challenge.status = ChallengeStatus::Cancelled;
        challenge.updated_at = current_time;

        // Calculate refund amount before processing refunds
        let total_refund = balance::value(&challenge.bid_pool);

        // Remove all squads from active registry
        remove_squads_from_active_registry(active_squad_registry, challenge);

        // Refund all participants
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
        let mut total_fees_refunded = 0u64;
        
        while (i < vector::length(&challenge.participants)) {
            let participant = *vector::borrow(&challenge.participants, i);
            let bid_amount = *table::borrow(&challenge.participant_bids, participant);
            let fee_amount = *table::borrow(&challenge.participant_fees, participant);
            
            // Refund bid
            if (bid_amount > 0) {
                let refund_coin = coin::from_balance(
                    balance::split(&mut challenge.bid_pool, bid_amount),
                    ctx
                );
                transfer::public_transfer(refund_coin, participant);
            };
            
            // Refund fee
            if (fee_amount > 0) {
                let fee_refund_coin = coin::from_balance(
                    balance::split(&mut challenge.fee_vault, fee_amount),
                    ctx
                );
                transfer::public_transfer(fee_refund_coin, participant);
                total_fees_refunded = total_fees_refunded + fee_amount;
            };
            
            i = i + 1;
        };
        
        // Emit fees refunded event
        if (total_fees_refunded > 0) {
            event::emit(FeesRefunded {
                challenge_id: object::id(challenge),
                total_fees_refunded,
                participant_count: vector::length(&challenge.participants),
            });
        };
        
        // Clean up tables (optional, but good practice)
        while (!vector::is_empty(&challenge.participants)) {
            let participant = vector::pop_back(&mut challenge.participants);
            if (table::contains(&challenge.participant_bids, participant)) {
                table::remove(&mut challenge.participant_bids, participant);
            };
            if (table::contains(&challenge.participant_fees, participant)) {
                table::remove(&mut challenge.participant_fees, participant);
            };
            if (table::contains(&challenge.participant_squads, participant)) {
                table::remove(&mut challenge.participant_squads, participant);
            };
        };
        challenge.current_participants = 0;
    }

    // Auto-expire challenge if it hasn't started after scheduled time + grace period
    public entry fun expire_challenge(
        active_squad_registry: &mut ActiveSquadRegistry,
        challenge: &mut Challenge,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        let grace_period = 3600000; // 1 hour grace period
        
        assert!(challenge.status == ChallengeStatus::Scheduled, EChallengeNotScheduled);
        assert!(current_time > challenge.scheduled_start_time + grace_period, EChallengeNotStarted);

        // Calculate refund amount before processing refunds
        let total_refund = balance::value(&challenge.bid_pool);

        // Cancel and refund
        challenge.status = ChallengeStatus::Cancelled;
        challenge.updated_at = current_time;

        // Remove all squads from active registry
        remove_squads_from_active_registry(active_squad_registry, challenge);
        
        refund_participants(challenge, ctx);

        event::emit(ChallengeCancelled {
            challenge_id: object::id(challenge),
            reason: string::utf8(b"Expired - not started within grace period"),
            refund_amount: total_refund,
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
        ChallengeStatus,  // status
        u64,              // total_pool
        u64               // total_fees_collected
    ) {
        (
            challenge.creator,
            challenge.bid_amount,
            challenge.max_participants,
            challenge.current_participants,
            challenge.scheduled_start_time,
            challenge.duration,
            challenge.winner,
            challenge.status,
            balance::value(&challenge.bid_pool),
            balance::value(&challenge.fee_vault)
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

    public fun get_participant_fee(challenge: &Challenge, participant: address): u64 {
        if (table::contains(&challenge.participant_fees, participant)) {
            *table::borrow(&challenge.participant_fees, participant)
        } else {
            0
        }
    }

    public fun get_participant_total_payment(challenge: &Challenge, participant: address): u64 {
        get_participant_bid(challenge, participant) + get_participant_fee(challenge, participant)
    }

    // Helper function to calculate total required payment for a bid amount
    public fun calculate_total_payment(fee_config: &FeeConfig, bid_amount: u64): (u64, u64, u64) {
        let fee_amount = (bid_amount * admin::get_upfront_fee_bps(fee_config)) / 10000;
        let total_required = bid_amount + fee_amount;
        (bid_amount, fee_amount, total_required)
    }

    public fun get_participant_squad(challenge: &Challenge, participant: address): u64 {
        if (table::contains(&challenge.participant_squads, participant)) {
            *table::borrow(&challenge.participant_squads, participant)
        } else {
            0
        }
    }

    public fun is_participant(challenge: &Challenge, address: address): bool {
        vector::contains(&challenge.participants, &address)
    }

    public fun is_squad_in_challenge(challenge: &Challenge, squad_id: u64): bool {
        let mut i = 0;
        while (i < vector::length(&challenge.participants)) {
            let participant = *vector::borrow(&challenge.participants, i);
            let participant_squad_id = *table::borrow(&challenge.participant_squads, participant);
            if (participant_squad_id == squad_id) {
                return true
            };
            i = i + 1;
        };
        false
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
        match (status) {
            ChallengeStatus::Scheduled => string::utf8(b"Scheduled"),
            ChallengeStatus::Active => string::utf8(b"Active"),
            ChallengeStatus::Completed => string::utf8(b"Completed"),
            ChallengeStatus::Cancelled => string::utf8(b"Cancelled"),
        }
    }

    public fun get_challenge_squads(challenge: &Challenge): vector<u64> {
        let mut squad_ids = vector::empty<u64>();
        let mut i = 0;
        while (i < vector::length(&challenge.participants)) {
            let participant = *vector::borrow(&challenge.participants, i);
            let squad_id = *table::borrow(&challenge.participant_squads, participant);
            vector::push_back(&mut squad_ids, squad_id);
            i = i + 1;
        };
        squad_ids
    }

    // Check if a squad is currently active in any challenge
    public fun is_squad_active(active_squad_registry: &ActiveSquadRegistry, squad_id: u64): bool {
        table::contains(&active_squad_registry.active_squads, squad_id)
    }

    // Get the challenge ID where a squad is active (if any)
    public fun get_squad_active_challenge(active_squad_registry: &ActiveSquadRegistry, squad_id: u64): Option<ID> {
        if (table::contains(&active_squad_registry.active_squads, squad_id)) {
            option::some(*table::borrow(&active_squad_registry.active_squads, squad_id))
        } else {
            option::none()
        }
    }

    // Register a squad as active in a challenge/match (public function for other modules)
    public fun register_squad_active(active_squad_registry: &mut ActiveSquadRegistry, squad_id: u64, challenge_id: ID) {
        table::add(&mut active_squad_registry.active_squads, squad_id, challenge_id);
    }

    // Unregister a squad from active challenges/matches (public function for other modules)
    public fun unregister_squad_active(active_squad_registry: &mut ActiveSquadRegistry, squad_id: u64) {
        table::remove(&mut active_squad_registry.active_squads, squad_id);
    }

    // Update a squad's active challenge/match ID (public function for other modules)
    public fun update_squad_active(active_squad_registry: &mut ActiveSquadRegistry, squad_id: u64, new_challenge_id: ID) {
        if (table::contains(&active_squad_registry.active_squads, squad_id)) {
            let active_id = table::borrow_mut(&mut active_squad_registry.active_squads, squad_id);
            *active_id = new_challenge_id;
        } else {
            table::add(&mut active_squad_registry.active_squads, squad_id, new_challenge_id);
        };
    }
}