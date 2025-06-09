#[allow(duplicate_alias,unused_use)]

module bullfy::match_escrow {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use bullfy::admin::AdminCap;

    // Error codes
    #[error]
    const ENotOwner: vector<u8> = b"Only the owner can perform this action";
    #[error]
    const EMatchNotFound: vector<u8> = b"Match not found";
    #[error]
    const EInsufficientBid: vector<u8> = b"Bid amount is below the minimum required";
    #[error]
    const EMatchAlreadyCompleted: vector<u8> = b"Match has already been completed";
    #[error]
    const ENoMatchingOpponent: vector<u8> = b"No matching opponent found";
    #[error]
    const EInvalidWinner: vector<u8> = b"Winner must be one of the participants";
    #[error]
    const EMatchNotActive: vector<u8> = b"Match is not in active state";
    #[error]
    const EBidAmountMismatch: vector<u8> = b"Bid amounts must match for pairing";

    // Constants
    const MIN_BID_AMOUNT: u64 = 10_000_000; // 0.01 SUI in MIST
    const PLATFORM_FEE_BPS: u64 = 250; // 2.5% platform fee
    const MATCH_TIMEOUT: u64 = 3600000; // 1 hour timeout in milliseconds

    // Status enums
    public enum EscrowStatus has copy, drop, store {
        WaitingForMatch,
        Matched,
        Cancelled
    }

    public enum MatchStatus has copy, drop, store {
        Active,
        Completed,
        Cancelled,
        Expired
    }

    // Individual escrow while waiting for match
    public struct PendingEscrow has key, store {
        id: UID,
        player: address,
        bid_amount: u64,
        funds: Balance<SUI>,
        game_duration: u64, // Preferred game duration in minutes
        created_at: u64,
        status: EscrowStatus,
    }

    // Combined escrow when two players are matched
    public struct ActiveMatch has key, store {
        id: UID,
        player1: address,
        player2: address,
        total_pool: Balance<SUI>,
        individual_bid: u64,
        game_duration: u64,
        created_at: u64,
        expires_at: u64,
        status: MatchStatus,
        winner: Option<address>,
    }

    // Global registry for managing matches
    public struct MatchRegistry has key {
        id: UID,
        pending_escrows: Table<u64, PendingEscrow>,
        active_matches: Table<u64, ActiveMatch>,
        escrow_counter: u64,
        match_counter: u64,
        // Index for quick matching by bid amount and duration
        bid_duration_index: Table<vector<u8>, vector<u64>>, // key: bid_amount + duration, value: escrow_ids
    }

    // Events
    public struct EscrowCreated has copy, drop {
        escrow_id: u64,
        player: address,
        bid_amount: u64,
        game_duration: u64,
    }

    public struct PlayersMatched has copy, drop {
        match_id: u64,
        escrow1_id: u64,
        escrow2_id: u64,
        player1: address,
        player2: address,
        total_pool: u64,
        game_duration: u64,
    }

    public struct MatchCompleted has copy, drop {
        match_id: u64,
        winner: address,
        loser: address,
        prize_amount: u64,
        platform_fee: u64,
    }

    public struct EscrowCancelled has copy, drop {
        escrow_id: u64,
        player: address,
        refund_amount: u64,
    }

    public struct MatchExpired has copy, drop {
        match_id: u64,
        player1: address,
        player2: address,
        refund_amount: u64,
    }

    // Initialize the registry
    fun init(ctx: &mut TxContext) {
        let registry = MatchRegistry {
            id: object::new(ctx),
            pending_escrows: table::new(ctx),
            active_matches: table::new(ctx),
            escrow_counter: 0,
            match_counter: 0,
            bid_duration_index: table::new(ctx),
        };
        
        transfer::share_object(registry);
    }

    // Helper function to create index key
    fun create_index_key(bid_amount: u64, duration: u64): vector<u8> {
        let mut key = vector::empty<u8>();
        
        // Convert bid_amount to bytes
        let mut bid_bytes = vector::empty<u8>();
        let mut temp_bid = bid_amount;
        while (temp_bid > 0) {
            vector::push_back(&mut bid_bytes, ((temp_bid % 256) as u8));
            temp_bid = temp_bid / 256;
        };
        vector::append(&mut key, bid_bytes);
        
        // Add separator
        vector::push_back(&mut key, 255u8);
        
        // Convert duration to bytes
        let mut duration_bytes = vector::empty<u8>();
        let mut temp_duration = duration;
        while (temp_duration > 0) {
            vector::push_back(&mut duration_bytes, ((temp_duration % 256) as u8));
            temp_duration = temp_duration / 256;
        };
        vector::append(&mut key, duration_bytes);
        
        key
    }

    // Create escrow and attempt to find a match
    public entry fun create_escrow_and_match(
        registry: &mut MatchRegistry,
        bid: Coin<SUI>,
        game_duration: u64, // in minutes
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        let bid_amount = coin::value(&bid);
        let current_time = clock::timestamp_ms(clock);
        
        // Validate bid amount
        assert!(bid_amount >= MIN_BID_AMOUNT, EInsufficientBid);
        
        // Create index key for matching
        let index_key = create_index_key(bid_amount, game_duration);
        
        // Check if there's a matching opponent
        if (table::contains(&registry.bid_duration_index, index_key)) {
            let escrow_ids = table::borrow_mut(&mut registry.bid_duration_index, index_key);
            
            if (!vector::is_empty(escrow_ids)) {
                // Found a match! Remove the first waiting escrow
                let opponent_escrow_id = vector::remove(escrow_ids, 0);
                
                // If this was the last escrow for this key, remove the key
                if (vector::is_empty(escrow_ids)) {
                    let empty_vec = table::remove(&mut registry.bid_duration_index, index_key);
                    vector::destroy_empty(empty_vec);
                };
                
                // Get opponent's escrow
                let opponent_escrow = table::remove(&mut registry.pending_escrows, opponent_escrow_id);
                
                // Create the active match
                create_active_match(
                    registry,
                    opponent_escrow,
                    player,
                    bid,
                    current_time,
                    ctx
                );
                
                return
            }
        };
        
        // No match found, create pending escrow
        let escrow_id = registry.escrow_counter;
        registry.escrow_counter = escrow_id + 1;
        
        let pending_escrow = PendingEscrow {
            id: object::new(ctx),
            player,
            bid_amount,
            funds: coin::into_balance(bid),
            game_duration,
            created_at: current_time,
            status: EscrowStatus::WaitingForMatch,
        };
        
        // Add to registry
        table::add(&mut registry.pending_escrows, escrow_id, pending_escrow);
        
        // Add to index for matching
        if (!table::contains(&registry.bid_duration_index, index_key)) {
            table::add(&mut registry.bid_duration_index, index_key, vector::empty<u64>());
        };
        let escrow_list = table::borrow_mut(&mut registry.bid_duration_index, index_key);
        vector::push_back(escrow_list, escrow_id);
        
        // Emit event
        event::emit(EscrowCreated {
            escrow_id,
            player,
            bid_amount,
            game_duration,
        });
    }

    // Helper function to create active match from two escrows
    fun create_active_match(
        registry: &mut MatchRegistry,
        mut opponent_escrow: PendingEscrow,
        new_player: address,
        new_bid: Coin<SUI>,
        current_time: u64,
        ctx: &mut TxContext
    ) {
        let match_id = registry.match_counter;
        registry.match_counter = match_id + 1;
        
        // Extract funds from opponent's escrow
        let opponent_funds = balance::withdraw_all(&mut opponent_escrow.funds);
        let new_funds = coin::into_balance(new_bid);
        
        // Combine funds
        let mut total_pool = opponent_funds;
        balance::join(&mut total_pool, new_funds);
        
        // Create active match
        let active_match = ActiveMatch {
            id: object::new(ctx),
            player1: opponent_escrow.player,
            player2: new_player,
            total_pool,
            individual_bid: opponent_escrow.bid_amount,
            game_duration: opponent_escrow.game_duration,
            created_at: current_time,
            expires_at: current_time + MATCH_TIMEOUT,
            status: MatchStatus::Active,
            winner: option::none(),
        };
        
        // Store the match
        table::add(&mut registry.active_matches, match_id, active_match);
        
        // Clean up opponent's escrow
        let PendingEscrow { 
            id, 
            player: _, 
            bid_amount: _, 
            funds, 
            game_duration: _, 
            created_at: _, 
            status: _ 
        } = opponent_escrow;
        balance::destroy_zero(funds);
        object::delete(id);
        
        // Emit event
        event::emit(PlayersMatched {
            match_id,
            escrow1_id: 0, // We don't track this anymore since escrow is consumed
            escrow2_id: 0,
            player1: opponent_escrow.player,
            player2: new_player,
            total_pool: balance::value(&active_match.total_pool),
            game_duration: opponent_escrow.game_duration,
        });
    }

    // Complete a match and distribute winnings
    public entry fun complete_match(
        _admin_cap: &AdminCap,
        registry: &mut MatchRegistry,
        match_id: u64,
        winner: address,
        ctx: &mut TxContext
    ) {
        // Verify match exists and is active
        assert!(table::contains(&registry.active_matches, match_id), EMatchNotFound);
        
        let mut active_match = table::remove(&mut registry.active_matches, match_id);
        assert!(active_match.status == MatchStatus::Active, EMatchNotActive);
        
        // Verify winner is a participant
        assert!(
            winner == active_match.player1 || winner == active_match.player2,
            EInvalidWinner
        );
        
        // Calculate prize distribution
        let total_pool = balance::value(&active_match.total_pool);
        let platform_fee = (total_pool * PLATFORM_FEE_BPS) / 10000;
        let winner_prize = total_pool - platform_fee;
        
        // Update match status
        active_match.status = MatchStatus::Completed;
        active_match.winner = option::some(winner);
        
        // Determine loser
        let loser = if (winner == active_match.player1) {
            active_match.player2
        } else {
            active_match.player1
        };
        
        // Transfer prize to winner
        if (winner_prize > 0) {
            let winner_coin = coin::from_balance(
                balance::split(&mut active_match.total_pool, winner_prize),
                ctx
            );
            transfer::public_transfer(winner_coin, winner);
        };
        
        // Transfer platform fee (you can integrate with fee_collector here)
        if (platform_fee > 0) {
            let fee_coin = coin::from_balance(
                balance::split(&mut active_match.total_pool, platform_fee),
                ctx
            );
            // For now, send to admin - you can integrate with fee_collector
            transfer::public_transfer(fee_coin, tx_context::sender(ctx));
        };
        
        // Clean up match
        let ActiveMatch { 
            id, 
            player1: _, 
            player2: _, 
            total_pool, 
            individual_bid: _, 
            game_duration: _, 
            created_at: _, 
            expires_at: _, 
            status: _, 
            winner: _ 
        } = active_match;
        balance::destroy_zero(total_pool);
        object::delete(id);
        
        // Emit event
        event::emit(MatchCompleted {
            match_id,
            winner,
            loser,
            prize_amount: winner_prize,
            platform_fee,
        });
    }

    // Cancel pending escrow and refund
    public entry fun cancel_escrow(
        registry: &mut MatchRegistry,
        escrow_id: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify escrow exists
        assert!(table::contains(&registry.pending_escrows, escrow_id), EMatchNotFound);
        
        let escrow = table::borrow(&registry.pending_escrows, escrow_id);
        assert!(escrow.player == sender, ENotOwner);
        
        // Remove from registry
        let mut pending_escrow = table::remove(&mut registry.pending_escrows, escrow_id);
        
        // Remove from index
        let index_key = create_index_key(pending_escrow.bid_amount, pending_escrow.game_duration);
        if (table::contains(&registry.bid_duration_index, index_key)) {
            let escrow_list = table::borrow_mut(&mut registry.bid_duration_index, index_key);
            let (found, index) = vector::index_of(escrow_list, &escrow_id);
            if (found) {
                vector::remove(escrow_list, index);
                if (vector::is_empty(escrow_list)) {
                    let empty_vec = table::remove(&mut registry.bid_duration_index, index_key);
                    vector::destroy_empty(empty_vec);
                };
            };
        };
        
        // Refund player
        let refund_amount = balance::value(&pending_escrow.funds);
        let refund_coin = coin::from_balance(
            balance::withdraw_all(&mut pending_escrow.funds),
            ctx
        );
        transfer::public_transfer(refund_coin, sender);
        
        // Clean up escrow
        let PendingEscrow { 
            id, 
            player: _, 
            bid_amount: _, 
            funds, 
            game_duration: _, 
            created_at: _, 
            status: _ 
        } = pending_escrow;
        balance::destroy_zero(funds);
        object::delete(id);
        
        // Emit event
        event::emit(EscrowCancelled {
            escrow_id,
            player: sender,
            refund_amount,
        });
    }

    // Expire match and refund both players
    public entry fun expire_match(
        registry: &mut MatchRegistry,
        match_id: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.active_matches, match_id), EMatchNotFound);
        
        let mut active_match = table::remove(&mut registry.active_matches, match_id);
        let current_time = clock::timestamp_ms(clock);
        
        // Check if match has expired
        assert!(current_time > active_match.expires_at, EMatchNotActive);
        assert!(active_match.status == MatchStatus::Active, EMatchNotActive);
        
        // Update status
        active_match.status = MatchStatus::Expired;
        
        // Refund both players equally
        let total_pool = balance::value(&active_match.total_pool);
        let refund_per_player = total_pool / 2;
        
        // Refund player1
        if (refund_per_player > 0) {
            let refund1 = coin::from_balance(
                balance::split(&mut active_match.total_pool, refund_per_player),
                ctx
            );
            transfer::public_transfer(refund1, active_match.player1);
        };
        
        // Refund player2 (remaining balance)
        let remaining = balance::value(&active_match.total_pool);
        if (remaining > 0) {
            let refund2 = coin::from_balance(
                balance::withdraw_all(&mut active_match.total_pool),
                ctx
            );
            transfer::public_transfer(refund2, active_match.player2);
        };
        
        // Clean up match
        let ActiveMatch { 
            id, 
            player1, 
            player2, 
            total_pool, 
            individual_bid: _, 
            game_duration: _, 
            created_at: _, 
            expires_at: _, 
            status: _, 
            winner: _ 
        } = active_match;
        balance::destroy_zero(total_pool);
        object::delete(id);
        
        // Emit event
        event::emit(MatchExpired {
            match_id,
            player1,
            player2,
            refund_amount: total_pool,
        });
    }

    // View functions
    public fun get_pending_escrow_info(registry: &MatchRegistry, escrow_id: u64): (address, u64, u64, u64) {
        assert!(table::contains(&registry.pending_escrows, escrow_id), EMatchNotFound);
        let escrow = table::borrow(&registry.pending_escrows, escrow_id);
        (escrow.player, escrow.bid_amount, escrow.game_duration, escrow.created_at)
    }

    public fun get_active_match_info(registry: &MatchRegistry, match_id: u64): (address, address, u64, u64, u64, u64) {
        assert!(table::contains(&registry.active_matches, match_id), EMatchNotFound);
        let match_obj = table::borrow(&registry.active_matches, match_id);
        (
            match_obj.player1,
            match_obj.player2,
            balance::value(&match_obj.total_pool),
            match_obj.game_duration,
            match_obj.created_at,
            match_obj.expires_at
        )
    }

    public fun get_pending_count(registry: &MatchRegistry): u64 {
        table::length(&registry.pending_escrows)
    }

    public fun get_active_matches_count(registry: &MatchRegistry): u64 {
        table::length(&registry.active_matches)
    }
}