module bullfy::match_escrow {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use bullfy::squad_manager::{Self, SquadRegistry};
    use bullfy::fee_collector::{Self, Fees};
    use bullfy::squad_player_challenge::{Self, ActiveSquadRegistry};
    use bullfy::admin::{Self, AdminCap, FeeConfig};

    // Error constants
    #[error]
    const E_UNAUTHORIZED: vector<u8> = b"Sender is not authorized to perform this action";
    #[error]
    const E_INVALID_BID_AMOUNT: vector<u8> = b"Bid amount must be greater than zero";
    #[error]
    const E_INVALID_DURATION: vector<u8> = b"Duration must be between 5 minutes and 7 days";
    #[error]
    const E_SQUAD_NOT_OWNED: vector<u8> = b"Player does not own the specified squad";
    #[error]
    const E_SQUAD_NOT_ALIVE: vector<u8> = b"Squad is not alive and cannot participate";
    #[error]
    const E_BID_NOT_FOUND: vector<u8> = b"Bid not found";
    #[error]
    const E_CANNOT_MATCH_OWN_BID: vector<u8> = b"Cannot match your own bid";
    #[error]
    const E_INSUFFICIENT_PAYMENT: vector<u8> = b"Payment amount is insufficient";
    #[error]
    const E_BID_AMOUNT_MISMATCH: vector<u8> = b"Bid amounts must match";
    #[error]
    const E_DURATION_MISMATCH: vector<u8> = b"Bid durations must match";
    #[error]
    const E_MATCH_NOT_FOUND: vector<u8> = b"Match not found";
    #[error]
    const E_MATCH_NOT_ACTIVE: vector<u8> = b"Match is not in active state";
    #[error]
    const E_MATCH_ALREADY_COMPLETED: vector<u8> = b"Match has already been completed";
    #[error]
    const E_INVALID_WINNER: vector<u8> = b"Winner must be one of the match participants";
    #[error]
    const E_SQUAD_ALREADY_ACTIVE: vector<u8> = b"Squad is already active in another match or bid";

    // Constants
    const MIN_BID_AMOUNT: u64 = 1_000_000; // 0.001 SUI in MIST
    const MIN_DURATION: u64 = 60_000; // 1 minute in milliseconds
    const MAX_DURATION: u64 = 1_800_000; // 30 minutes in milliseconds

    // Bid status enum
    public enum BidStatus has copy, drop, store {
        Open,      // Available for matching
        Matched,   // Matched and match is active
        Cancelled, // Cancelled by creator
    }

    // Match status enum
    public enum MatchStatus has copy, drop, store {
        Active,    // Match is ongoing
        Completed, // Match completed with winner
        Disputed,  // Match result is disputed
    }

    // Individual bid struct
    public struct Bid has key, store {
        id: UID,
        creator: address,
        squad_id: u64,
        bid_amount: u64,
        duration: u64, // Match duration in milliseconds
        escrow: Balance<SUI>, // Escrowed bid amount
        fee_balance: Balance<SUI>, // Escrowed fee amount (not sent to collector yet)
        created_at: u64,
        status: BidStatus,
    }

    // Match between two bids
    public struct Match has key, store {
        id: UID,
        bid1_id: ID, // First bid ID
        bid2_id: ID, // Second bid ID
        player1: address,
        player2: address,
        squad1_id: u64,
        squad2_id: u64,
        total_prize: u64, // Total prize pool (both bids)
        total_fees: u64, // Total fees from both bids
        duration: u64,
        started_at: u64,
        ends_at: u64,
        status: MatchStatus,
        winner: Option<address>,
        prize_claimed: bool,
        fees_collected: bool, // Track if fees have been sent to collector
    }

    // Registry for bids and matches
    public struct EscrowRegistry has key {
        id: UID,
        active_bids: vector<Bid>, // Active open bids
        completed_bids: Table<ID, Bid>, // Completed/cancelled bids stored by ID
        active_matches: vector<Match>, // Active ongoing matches
        completed_matches: Table<ID, Match>, // Completed matches stored by ID
        user_active_bids: Table<address, vector<u64>>, // Track user's active bid indices
        user_completed_bids: Table<address, vector<ID>>, // Track user's completed bid IDs
        user_active_matches: Table<address, vector<u64>>, // Track user's active match indices
        user_completed_matches: Table<address, vector<ID>>, // Track user's completed match IDs
        bid_id_to_index: Table<ID, u64>, // Map bid ID to vector index for active bids only
        match_id_to_index: Table<ID, u64>, // Map match ID to vector index for active matches only
        next_bid_id: u64,
        next_match_id: u64,
    }

    // Events
    public struct BidCreated has copy, drop {
        bid_id: ID,
        creator: address,
        squad_id: u64,
        bid_amount: u64,
        duration: u64,
    }

    public struct BidsMatched has copy, drop {
        bid1_id: ID,
        bid2_id: ID,
        match_id: ID,
        player1: address,
        player2: address,
        squad1_id: u64,
        squad2_id: u64,
        total_prize: u64,
        duration: u64,
        ends_at: u64,
    }

    public struct BidCancelled has copy, drop {
        bid_id: ID,
        creator: address,
        refund_amount: u64,
    }

    public struct MatchCompleted has copy, drop {
        match_id: ID,
        winner: address,
        loser: address,
        prize_amount: u64,
        total_fees: u64,
    }

    public struct PrizeClaimed has copy, drop {
        match_id: ID,
        winner: address,
        amount: u64,
    }

    // Initialize the escrow registry
    fun init(ctx: &mut TxContext) {
        let registry = EscrowRegistry {
            id: object::new(ctx),
            active_bids: vector::empty<Bid>(),
            completed_bids: table::new(ctx),
            active_matches: vector::empty<Match>(),
            completed_matches: table::new(ctx),
            user_active_bids: table::new(ctx),
            user_completed_bids: table::new(ctx),
            user_active_matches: table::new(ctx),
            user_completed_matches: table::new(ctx),
            bid_id_to_index: table::new(ctx),
            match_id_to_index: table::new(ctx),
            next_bid_id: 1,
            next_match_id: 1,
        };
        transfer::share_object(registry);
    }

    // Create a new bid for a two-player challenge
    public entry fun create_bid(
        registry: &mut EscrowRegistry,
        squad_registry: &SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        fee_config: &FeeConfig,
        squad_id: u64,
        bid_amount: u64,
        duration: u64, // Match duration in milliseconds
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate inputs
        assert!(bid_amount >= MIN_BID_AMOUNT, E_INVALID_BID_AMOUNT);
        assert!(duration >= MIN_DURATION && duration <= MAX_DURATION, E_INVALID_DURATION);

        // Validate squad ownership and status
        let squad = squad_manager::get_squad(squad_registry, squad_id);
        assert!(squad_manager::get_squad_owner(squad) == creator, E_SQUAD_NOT_OWNED);
        assert!(squad_manager::is_squad_alive(squad), E_SQUAD_NOT_ALIVE);

        // Check if squad is already active
        assert!(!squad_player_challenge::is_squad_active(active_squad_registry, squad_id), E_SQUAD_ALREADY_ACTIVE);

        // Calculate required payment (bid + upfront fee)
        let fee_amount = (bid_amount * admin::get_upfront_fee_bps(fee_config)) / 10000;
        let total_required = bid_amount + fee_amount;
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= total_required, E_INSUFFICIENT_PAYMENT);

        // Handle payment - split into bid and fee, return change if any
        let (escrow_balance, fee_balance) = if (payment_amount == total_required) {
            // Exact amount - split into bid and fee
            let fee_coin = coin::split(&mut payment, fee_amount, ctx);
            (coin::into_balance(payment), coin::into_balance(fee_coin))
        } else {
            // Overpaid - split exact amounts and return change
            let fee_coin = coin::split(&mut payment, fee_amount, ctx);
            let bid_coin = coin::split(&mut payment, bid_amount, ctx);
            transfer::public_transfer(payment, creator); // Return change
            (coin::into_balance(bid_coin), coin::into_balance(fee_coin))
        };

        // Create the bid (store fee, don't send to collector yet)
        let bid = Bid {
            id: object::new(ctx),
            creator,
            squad_id,
            bid_amount,
            duration,
            escrow: escrow_balance,
            fee_balance,
            created_at: current_time,
            status: BidStatus::Open,
        };

        let bid_id = object::id(&bid);

        // Add to registry
        vector::push_back(&mut registry.active_bids, bid);
        table::add(&mut registry.bid_id_to_index, bid_id, vector::length(&registry.active_bids) - 1);

        // Register squad as active
        squad_player_challenge::register_squad_active(active_squad_registry, squad_id, bid_id);

        // Track user's bids
        if (!table::contains(&registry.user_active_bids, creator)) {
            table::add(&mut registry.user_active_bids, creator, vector::empty<u64>());
        };
        let user_active_bids = table::borrow_mut(&mut registry.user_active_bids, creator);
        vector::push_back(user_active_bids, vector::length(&registry.active_bids) - 1);

        // Emit event
        event::emit(BidCreated {
            bid_id,
            creator,
            squad_id,
            bid_amount,
            duration,
        });
    }

    // Match two specific bids together (called by frontend to match two bids together )
    public entry fun match_bids(
        _: &AdminCap,
        registry: &mut EscrowRegistry,
        _squad_registry: &SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        bid1_id: ID,
        bid2_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);

        // Validate both bids exist
        assert!(table::contains(&registry.bid_id_to_index, bid1_id), E_BID_NOT_FOUND);
        assert!(table::contains(&registry.bid_id_to_index, bid2_id), E_BID_NOT_FOUND);

        // Get bid info (without mutable borrow first)
        let (bid1_creator, bid1_squad_id, bid1_amount, bid1_duration, bid1_fee_amount);
        let (bid2_creator, bid2_squad_id, _bid2_amount, _bid2_duration, bid2_fee_amount);
        {
            let bid1_index = *table::borrow(&registry.bid_id_to_index, bid1_id);
            let bid2_index = *table::borrow(&registry.bid_id_to_index, bid2_id);

            // Validate bid status
            assert!(vector::borrow(&registry.active_bids, bid1_index).status == BidStatus::Open, E_BID_NOT_FOUND);
            assert!(vector::borrow(&registry.active_bids, bid2_index).status == BidStatus::Open, E_BID_NOT_FOUND);

            // Validate different creators
            assert!(vector::borrow(&registry.active_bids, bid1_index).creator != vector::borrow(&registry.active_bids, bid2_index).creator, E_CANNOT_MATCH_OWN_BID);

            // Validate matching amounts and durations
            assert!(vector::borrow(&registry.active_bids, bid1_index).bid_amount == vector::borrow(&registry.active_bids, bid2_index).bid_amount, E_BID_AMOUNT_MISMATCH);
            assert!(vector::borrow(&registry.active_bids, bid1_index).duration == vector::borrow(&registry.active_bids, bid2_index).duration, E_DURATION_MISMATCH);

            bid1_creator = vector::borrow(&registry.active_bids, bid1_index).creator;
            bid1_squad_id = vector::borrow(&registry.active_bids, bid1_index).squad_id;
            bid1_amount = vector::borrow(&registry.active_bids, bid1_index).bid_amount;
            bid1_duration = vector::borrow(&registry.active_bids, bid1_index).duration;
            bid1_fee_amount = balance::value(&vector::borrow(&registry.active_bids, bid1_index).fee_balance);

            bid2_creator = vector::borrow(&registry.active_bids, bid2_index).creator;
            bid2_squad_id = vector::borrow(&registry.active_bids, bid2_index).squad_id;
            _bid2_amount = vector::borrow(&registry.active_bids, bid2_index).bid_amount;
            _bid2_duration = vector::borrow(&registry.active_bids, bid2_index).duration;
            bid2_fee_amount = balance::value(&vector::borrow(&registry.active_bids, bid2_index).fee_balance);
        };

        // Calculate total prize and fees
        let total_prize = bid1_amount * 2;
        let total_fees = bid1_fee_amount + bid2_fee_amount;

        // Create match
        let match_obj = Match {
            id: object::new(ctx),
            bid1_id,
            bid2_id,
            player1: bid1_creator,
            player2: bid2_creator,
            squad1_id: bid1_squad_id,
            squad2_id: bid2_squad_id,
            total_prize,
            total_fees,
            duration: bid1_duration,// calculated as milliseconds as an integer
            started_at: current_time,
            ends_at: current_time + bid1_duration, // append the duration to the current time 
            status: MatchStatus::Active,
            winner: option::none(),
            prize_claimed: false,
            fees_collected: false,
        };

        let match_id = object::id(&match_obj);

        // Update both bids status
        {
            let bid1_index = *table::borrow(&registry.bid_id_to_index, bid1_id);
            let bid1 = vector::borrow_mut(&mut registry.active_bids, bid1_index);
            bid1.status = BidStatus::Matched;
        };

        {
            let bid2_index = *table::borrow(&registry.bid_id_to_index, bid2_id);
            let bid2 = vector::borrow_mut(&mut registry.active_bids, bid2_index);
            bid2.status = BidStatus::Matched;
        };

        // Combine both bid balances and fee balances for match
        let (bid2_balance, bid2_fee_balance) = {
            let bid2_index = *table::borrow(&registry.bid_id_to_index, bid2_id);
            let bid2 = vector::borrow_mut(&mut registry.active_bids, bid2_index);
            (balance::withdraw_all(&mut bid2.escrow), balance::withdraw_all(&mut bid2.fee_balance))
        };
        
        {
            let bid1_index = *table::borrow(&registry.bid_id_to_index, bid1_id);
            let bid1 = vector::borrow_mut(&mut registry.active_bids, bid1_index);
            balance::join(&mut bid1.escrow, bid2_balance);
            balance::join(&mut bid1.fee_balance, bid2_fee_balance);
        };

        // Add match to registry
        vector::push_back(&mut registry.active_matches, match_obj);
        table::add(&mut registry.match_id_to_index, match_id, vector::length(&registry.active_matches) - 1);

        // Update active squads registry
        squad_player_challenge::unregister_squad_active(active_squad_registry, bid1_squad_id);
        squad_player_challenge::unregister_squad_active(active_squad_registry, bid2_squad_id);
        squad_player_challenge::register_squad_active(active_squad_registry, bid1_squad_id, match_id);
        squad_player_challenge::register_squad_active(active_squad_registry, bid2_squad_id, match_id);

        // Track user matches
        let users = vector[bid1_creator, bid2_creator];
        let mut i = 0;
        while (i < vector::length(&users)) {
            let user = *vector::borrow(&users, i);
            
            if (!table::contains(&registry.user_active_matches, user)) {
                table::add(&mut registry.user_active_matches, user, vector::empty<u64>());
            };
            let user_active_matches = table::borrow_mut(&mut registry.user_active_matches, user);
            vector::push_back(user_active_matches, vector::length(&registry.active_matches) - 1);
            
            i = i + 1;
        };

        // Emit event
        event::emit(BidsMatched {
            bid1_id,
            bid2_id,
            match_id,
            player1: bid1_creator,
            player2: bid2_creator,
            squad1_id: bid1_squad_id,
            squad2_id: bid2_squad_id,
            total_prize,
            duration: bid1_duration,
            ends_at: current_time + bid1_duration,
        });
    }

    // Cancel an open bid and refund the creator
    public entry fun cancel_bid(
        registry: &mut EscrowRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        bid_id: ID,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(table::contains(&registry.bid_id_to_index, bid_id), E_BID_NOT_FOUND);
        let bid_index = *table::borrow(&registry.bid_id_to_index, bid_id);
        
        // Validate authorization and status
        assert!(vector::borrow(&registry.active_bids, bid_index).creator == sender, E_UNAUTHORIZED);
        assert!(vector::borrow(&registry.active_bids, bid_index).status == BidStatus::Open, E_BID_NOT_FOUND);

        // Update status and refund both bid and fee amounts
        let bid = vector::borrow_mut(&mut registry.active_bids, bid_index);
        bid.status = BidStatus::Cancelled;
        let bid_refund_amount = balance::value(&bid.escrow);
        let fee_refund_amount = balance::value(&bid.fee_balance);
        let total_refund_amount = bid_refund_amount + fee_refund_amount;
        
        // Refund bid amount
        let bid_refund_balance = balance::withdraw_all(&mut bid.escrow);
        let mut bid_refund_coin = coin::from_balance(bid_refund_balance, ctx);
        
        // Refund fee amount
        let fee_refund_balance = balance::withdraw_all(&mut bid.fee_balance);
        let fee_refund_coin = coin::from_balance(fee_refund_balance, ctx);
        
        // Combine and transfer total refund
        coin::join(&mut bid_refund_coin, fee_refund_coin);
        transfer::public_transfer(bid_refund_coin, sender);

        // Remove squad from active registry
        squad_player_challenge::unregister_squad_active(active_squad_registry, bid.squad_id);

        // Move bid to completed vector
        move_bid_to_completed(registry, bid_id);

        // Emit event
        event::emit(BidCancelled {
            bid_id,
            creator: sender,
            refund_amount: total_refund_amount,
        });
    }

    // Complete a match by declaring a winner this must be called by the oracle or a backend service)
    public entry fun complete_match(
        _: &AdminCap,
        registry: &mut EscrowRegistry,
        squad_registry: &mut SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        match_id: ID,
        winner: address,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.match_id_to_index, match_id), E_MATCH_NOT_FOUND);
        let match_index = *table::borrow(&registry.match_id_to_index, match_id);
        let match_obj = vector::borrow_mut(&mut registry.active_matches, match_index);
        
        // Validate match status
        assert!(match_obj.status == MatchStatus::Active, E_MATCH_NOT_ACTIVE);
        assert!(!match_obj.prize_claimed, E_MATCH_ALREADY_COMPLETED);
        
        // Validate winner
        assert!(winner == match_obj.player1 || winner == match_obj.player2, E_INVALID_WINNER);
        
        let loser = if (winner == match_obj.player1) {
            match_obj.player2
        } else {
            match_obj.player1
        };

        // Update match
        match_obj.status = MatchStatus::Completed;
        match_obj.winner = option::some(winner);

        // Update squad life points
        let winner_squad_id = if (winner == match_obj.player1) {
            match_obj.squad1_id
        } else {
            match_obj.squad2_id
        };
        
        let loser_squad_id = if (loser == match_obj.player1) {
            match_obj.squad1_id
        } else {
            match_obj.squad2_id
        };

        // Winner gains life, loser loses life
        squad_manager::increase_squad_life(squad_registry, winner_squad_id);
        squad_manager::decrease_squad_life(squad_registry, loser_squad_id, clock);

        // Remove both squads from active registry since match is completed
        squad_player_challenge::unregister_squad_active(active_squad_registry, match_obj.squad1_id);
        squad_player_challenge::unregister_squad_active(active_squad_registry, match_obj.squad2_id);

        // Emit event with correct fee information
        event::emit(MatchCompleted {
            match_id,
            winner,
            loser,
            prize_amount: match_obj.total_prize,
            total_fees: match_obj.total_fees, // Total fees from both bids
        });
    }

    // Claim prize after winning a match
    public entry fun claim_prize(
        _: &AdminCap,
        registry: &mut EscrowRegistry,
        fees: &mut Fees,
        match_id: ID,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(table::contains(&registry.match_id_to_index, match_id), E_MATCH_NOT_FOUND);
        let match_index = *table::borrow(&registry.match_id_to_index, match_id);
        
        // Get all needed data before mutable borrow
        let (bid1_id, total_prize, fees_collected, total_fees);
        {
            let match_obj = vector::borrow(&registry.active_matches, match_index);
            
            // Validate claiming of the prize to avoid unauthorized users
            assert!(match_obj.status == MatchStatus::Completed, E_MATCH_NOT_ACTIVE);
            assert!(!match_obj.prize_claimed, E_MATCH_ALREADY_COMPLETED);
            assert!(option::contains(&match_obj.winner, &sender), E_UNAUTHORIZED);

            bid1_id = match_obj.bid1_id;
            total_prize = match_obj.total_prize;
            fees_collected = match_obj.fees_collected;
            total_fees = match_obj.total_fees;
        };

        // Get the original bid to access escrow and fees
        let bid_index = *table::borrow(&registry.bid_id_to_index, bid1_id);
        let bid = vector::borrow_mut(&mut registry.active_bids, bid_index);
        
        // Transfer prize to winner
        let prize_balance = balance::withdraw_all(&mut bid.escrow);
        let prize_coin = coin::from_balance(prize_balance, ctx);
        transfer::public_transfer(prize_coin, sender);
        
        // Send fees to collector (if any)
        if (!fees_collected && total_fees > 0) {
            let fee_balance = balance::withdraw_all(&mut bid.fee_balance);
            let fee_coin = coin::from_balance(fee_balance, ctx);
            fee_collector::collect(fees, fee_coin, ctx);
            
            // Update fees_collected status
            let match_obj = vector::borrow_mut(&mut registry.active_matches, match_index);
            match_obj.fees_collected = true;
        };
        
        // Mark as claimed
        {
            let match_obj = vector::borrow_mut(&mut registry.active_matches, match_index);
            match_obj.prize_claimed = true;
        };

        // Move match to completed vector
        move_match_to_completed(registry, match_id);

        // Emit event
        event::emit(PrizeClaimed {
            match_id,
            winner: sender,
            amount: total_prize,
        });
    }

    
    // Helper function to move completed bid from active to completed vector
    fun move_bid_to_completed(registry: &mut EscrowRegistry, bid_id: ID) {
        let bid_index = *table::borrow(&registry.bid_id_to_index, bid_id);
        let bid = vector::borrow(&registry.active_bids, bid_index);
        let creator = bid.creator;
        
        // Remove bid from active vector and add to completed table
        let bid = vector::remove(&mut registry.active_bids, bid_index);
        let bid_id_for_table = object::id(&bid);
        table::add(&mut registry.completed_bids, bid_id_for_table, bid);
        
        // Update user tracking - move from active to completed
        if (table::contains(&registry.user_active_bids, creator)) {
            let user_active_bids = table::borrow_mut(&mut registry.user_active_bids, creator);
            let mut i = 0;
            while (i < vector::length(user_active_bids)) {
                if (*vector::borrow(user_active_bids, i) == bid_index) {
                    vector::remove(user_active_bids, i);
                    break
                };
                i = i + 1;
            };
        };
        
        if (!table::contains(&registry.user_completed_bids, creator)) {
            table::add(&mut registry.user_completed_bids, creator, vector::empty<ID>());
        };
        let user_completed_bids = table::borrow_mut(&mut registry.user_completed_bids, creator);
        vector::push_back(user_completed_bids, bid_id_for_table);
        
        // Update indices for all active bids after the removed one
        let mut i = bid_index;
        while (i < vector::length(&registry.active_bids)) {
            let current_bid = vector::borrow(&registry.active_bids, i);
            let current_bid_id = object::id(current_bid);
            let index_ref = table::borrow_mut(&mut registry.bid_id_to_index, current_bid_id);
            *index_ref = i;
            i = i + 1;
        };
        
        // Remove the moved bid from index table
        table::remove(&mut registry.bid_id_to_index, bid_id);
    }

    // Helper function to move completed match from active to completed vector
    fun move_match_to_completed(registry: &mut EscrowRegistry, match_id: ID) {
        let match_index = *table::borrow(&registry.match_id_to_index, match_id);
        let match_obj = vector::borrow(&registry.active_matches, match_index);
        let player1 = match_obj.player1;
        let player2 = match_obj.player2;
        
        // Remove match from active vector and add to completed table
        let match_obj = vector::remove(&mut registry.active_matches, match_index);
        let match_id_for_table = object::id(&match_obj);
        table::add(&mut registry.completed_matches, match_id_for_table, match_obj);
        
        // Update user tracking - move from active to completed for both players
        let players = vector[player1, player2];
        let mut i = 0;
        while (i < vector::length(&players)) {
            let player = *vector::borrow(&players, i);
            
            // Remove from active matches
            if (table::contains(&registry.user_active_matches, player)) {
                let user_active_matches = table::borrow_mut(&mut registry.user_active_matches, player);
                let mut j = 0;
                while (j < vector::length(user_active_matches)) {
                    if (*vector::borrow(user_active_matches, j) == match_index) {
                        vector::remove(user_active_matches, j);
                        break
                    };
                    j = j + 1;
                };
            };
            
            // Add to completed matches
            if (!table::contains(&registry.user_completed_matches, player)) {
                table::add(&mut registry.user_completed_matches, player, vector::empty<ID>());
            };
            let user_completed_matches = table::borrow_mut(&mut registry.user_completed_matches, player);
            vector::push_back(user_completed_matches, match_id_for_table);
            
            i = i + 1;
        };
        
        // Update indices for all active matches after the removed one
        let mut i = match_index;
        while (i < vector::length(&registry.active_matches)) {
            let current_match = vector::borrow(&registry.active_matches, i);
            let current_match_id = object::id(current_match);
            let index_ref = table::borrow_mut(&mut registry.match_id_to_index, current_match_id);
            *index_ref = i;
            i = i + 1;
        };
        
        // Remove the moved match from index table
        table::remove(&mut registry.match_id_to_index, match_id);
    }

    // Helper functions to find completed bids/matches by ID
    public fun get_completed_bid_by_id(registry: &EscrowRegistry, bid_id: ID): &Bid {
        table::borrow(&registry.completed_bids, bid_id)
    }

    public fun get_completed_match_by_id(registry: &EscrowRegistry, match_id: ID): &Match {
        table::borrow(&registry.completed_matches, match_id)
    }

    // Check if bid/match is completed
    public fun is_bid_completed(registry: &EscrowRegistry, bid_id: ID): bool {
        table::contains(&registry.completed_bids, bid_id)
    }

    public fun is_match_completed(registry: &EscrowRegistry, match_id: ID): bool {
        table::contains(&registry.completed_matches, match_id)
    }

    // Get all completed bid IDs for a user
    public fun get_user_completed_bid_ids(registry: &EscrowRegistry, user: address): vector<ID> {
        if (table::contains(&registry.user_completed_bids, user)) {
            *table::borrow(&registry.user_completed_bids, user)
        } else {
            vector::empty<ID>()
        }
    }

    // Get all completed match IDs for a user  
    public fun get_user_completed_match_ids(registry: &EscrowRegistry, user: address): vector<ID> {
        if (table::contains(&registry.user_completed_matches, user)) {
            *table::borrow(&registry.user_completed_matches, user)
        } else {
            vector::empty<ID>()
        }
    }

    // Get all active bid IDs
    public fun get_all_active_bid_ids(registry: &EscrowRegistry): vector<ID> {
        let mut bid_ids = vector::empty<ID>();
        let mut i = 0;
        while (i < vector::length(&registry.active_bids)) {
            let bid = vector::borrow(&registry.active_bids, i);
            vector::push_back(&mut bid_ids, object::id(bid));
            i = i + 1;
        };
        bid_ids
    }

    // Get all active match IDs
    public fun get_all_active_match_ids(registry: &EscrowRegistry): vector<ID> {
        let mut match_ids = vector::empty<ID>();
        let mut i = 0;
        while (i < vector::length(&registry.active_matches)) {
            let match_obj = vector::borrow(&registry.active_matches, i);
            vector::push_back(&mut match_ids, object::id(match_obj));
            i = i + 1;
        };
        match_ids
    }

    // View functions
    public fun get_bid(registry: &EscrowRegistry, bid_id: ID): &Bid {
        let bid_index = *table::borrow(&registry.bid_id_to_index, bid_id);
        vector::borrow(&registry.active_bids, bid_index)
    }

    public fun get_match(registry: &EscrowRegistry, match_id: ID): &Match {
        let match_index = *table::borrow(&registry.match_id_to_index, match_id);
        vector::borrow(&registry.active_matches, match_index)
    }

    public fun get_user_active_bids(registry: &EscrowRegistry, user: address): &vector<u64> {
        table::borrow(&registry.user_active_bids, user)
    }

    public fun get_user_completed_bids(registry: &EscrowRegistry, user: address): &vector<ID> {
        table::borrow(&registry.user_completed_bids, user)
    }

    public fun get_user_active_matches(registry: &EscrowRegistry, user: address): &vector<u64> {
        table::borrow(&registry.user_active_matches, user)
    }

    public fun get_user_completed_matches(registry: &EscrowRegistry, user: address): &vector<ID> {
        table::borrow(&registry.user_completed_matches, user)
    }

    public fun get_active_bids(registry: &EscrowRegistry): &vector<Bid> {
        &registry.active_bids
    }

    public fun get_completed_bids(registry: &EscrowRegistry): &Table<ID, Bid> {
        &registry.completed_bids
    }

    public fun get_active_matches(registry: &EscrowRegistry): &vector<Match> {
        &registry.active_matches
    }

    public fun get_completed_matches(registry: &EscrowRegistry): &Table<ID, Match> {
        &registry.completed_matches
    }

    // Helper function to check if bid is still valid
    public fun is_bid_valid(bid: &Bid, _clock: &Clock): bool {
        bid.status == BidStatus::Open
    }


}

