module bullfy::match_escrow {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string;
    use bullfy::squad_manager::{Self, SquadRegistry};
    use bullfy::fee_collector::{Self, Fees};
    use bullfy::squad_player_challenge::{Self, ActiveSquadRegistry};
    use bullfy::admin::FeeConfig;
    use bullfy::match_signer::{Self, MatchSignerCap};
    use bullfy::common_errors;
    use bullfy::validators;
    use bullfy::payment_utils;
    use bullfy::fee_calculator;
    use bullfy::user_stats::{Self, UserStatsRegistry};
    use bullfy::math_utils;

    // Error constants (module-specific only)
    const EBidNotFound: u64 = 3001;
    const ECannotMatchOwnBid: u64 = 3002;
    const EBidAmountMismatch: u64 = 3003;
    const EDurationMismatch: u64 = 3004;
    const EMatchNotFound: u64 = 3005;
    const EMatchNotActive: u64 = 3006;
    const EMatchAlreadyCompleted: u64 = 3007;
    const EMatchNotEndedYet: u64 = 3009;

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
        // Individual player token tracking
        player1_initial_token_sum: u64, // Sum of player1's squad token values at start
        player2_initial_token_sum: u64, // Sum of player2's squad token values at start
        player1_final_token_sum: u64,   // Sum of player1's squad token values at end
        player2_final_token_sum: u64,   // Sum of player2's squad token values at end
        player1_percentage_increase: u64, // Player1's percentage increase (scaled by 10000 for precision)
        player2_percentage_increase: u64, // Player2's percentage increase (scaled by 10000 for precision)
        // Token price recording fields (for reference/events)
        squad1_token_prices: vector<u64>, // Token prices for squad1 at match start (in fixed point format)
        squad2_token_prices: vector<u64>, // Token prices for squad2 at match start (in fixed point format)
        squad1_final_token_prices: vector<u64>, // Token prices for squad1 at match completion (in fixed point format)
        squad2_final_token_prices: vector<u64>, // Token prices for squad2 at match completion (in fixed point format)
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
        player1_initial_token_sum: u64, // Player1's initial token sum
        player2_initial_token_sum: u64, // Player2's initial token sum
        squad1_token_prices: vector<u64>, // Token prices for squad1 at match start
        squad2_token_prices: vector<u64>, // Token prices for squad2 at match start
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
        // Token performance data
        player1_initial_sum: u64,
        player2_initial_sum: u64,
        player1_final_sum: u64,
        player2_final_sum: u64,
        player1_percentage_increase: u64, // Scaled by 10000 (e.g., 1500 = 15.00%)
        player2_percentage_increase: u64, // Scaled by 10000 (e.g., 1500 = 15.00%)
        squad1_final_token_prices: vector<u64>, // Final token prices for squad1 at match completion
        squad2_final_token_prices: vector<u64>, // Final token prices for squad2 at match completion
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
    entry fun create_bid(
        registry: &mut EscrowRegistry,
        squad_registry: &SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        fee_config: &FeeConfig,
        squad_id: u64,
        bid_amount: u64,
        duration: u64, // Match duration in milliseconds
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate inputs using common validators
        validators::validate_bid_amount(bid_amount, MIN_BID_AMOUNT);
        validators::validate_duration(duration, MIN_DURATION, MAX_DURATION);

        // Validate squad ownership and status using common validator
        validators::validate_squad_ownership_and_life(squad_registry, squad_id, creator);

        // Check if squad is already active
        assert!(!squad_player_challenge::is_squad_active(active_squad_registry, squad_id), common_errors::squad_already_active());

        // Calculate required payment using fee calculator
        let (fee_amount, _total_required) = fee_calculator::calculate_upfront_fee(bid_amount, fee_config);

        // Handle payment using common payment utils
        let (bid_coin, fee_coin) = payment_utils::handle_payment_with_fee(
            payment, 
            bid_amount, 
            fee_amount, 
            creator, 
            ctx
        );

        // Create the bid (store fee, don't send to collector yet)
        let bid = Bid {
            id: object::new(ctx),
            creator,
            squad_id,
            bid_amount,
            duration,
            escrow: bid_coin.into_balance(),
            fee_balance: fee_coin.into_balance(),
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
    entry fun match_bids(
        signer_cap: &MatchSignerCap,
        registry: &mut EscrowRegistry,
        _squad_registry: &SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        bid1_id: ID,
        bid2_id: ID,
        squad1_token_prices: vector<u64>, // Token prices for squad1 at match start
        squad2_token_prices: vector<u64>, // Token prices for squad2 at match start
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate signer authorization
        assert!(match_signer::validate_match_signer(signer_cap, ctx), common_errors::unauthorized());
        
        let current_time = clock::timestamp_ms(clock);

        // Validate both bids exist
        assert!(table::contains(&registry.bid_id_to_index, bid1_id), EBidNotFound);
        assert!(table::contains(&registry.bid_id_to_index, bid2_id), EBidNotFound);

        // Get bid info (without mutable borrow first)
        let (bid1_creator, bid1_squad_id, bid1_amount, bid1_duration, bid1_fee_amount);
        let (bid2_creator, bid2_squad_id, _bid2_amount, _bid2_duration, bid2_fee_amount);
        {
            let bid1_index = *table::borrow(&registry.bid_id_to_index, bid1_id);
            let bid2_index = *table::borrow(&registry.bid_id_to_index, bid2_id);

            // Validate bid status
            assert!(vector::borrow(&registry.active_bids, bid1_index).status == BidStatus::Open, EBidNotFound);
            assert!(vector::borrow(&registry.active_bids, bid2_index).status == BidStatus::Open, EBidNotFound);

            // Validate different creators
            assert!(vector::borrow(&registry.active_bids, bid1_index).creator != vector::borrow(&registry.active_bids, bid2_index).creator, ECannotMatchOwnBid);

            // Validate matching amounts and durations
            assert!(vector::borrow(&registry.active_bids, bid1_index).bid_amount == vector::borrow(&registry.active_bids, bid2_index).bid_amount, EBidAmountMismatch);
            assert!(vector::borrow(&registry.active_bids, bid1_index).duration == vector::borrow(&registry.active_bids, bid2_index).duration, EDurationMismatch);

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

        // Calculate total prize and fees using safe math
        let total_prize = calculate_total_prize(bid1_amount);
        let total_fees = math_utils::safe_add(bid1_fee_amount, bid2_fee_amount);

        // Calculate individual player token sums using safe math
        let player1_token_sum = calculate_initial_token_sum(&squad1_token_prices);
        let player2_token_sum = calculate_initial_token_sum(&squad2_token_prices);

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
            // Individual player token tracking
            player1_initial_token_sum: player1_token_sum,
            player2_initial_token_sum: player2_token_sum,
            player1_final_token_sum: 0,
            player2_final_token_sum: 0,
            player1_percentage_increase: 0,
            player2_percentage_increase: 0,
            // Token price recording fields (for reference/events)
            squad1_token_prices: squad1_token_prices,
            squad2_token_prices: squad2_token_prices,
            squad1_final_token_prices: vector::empty<u64>(),
            squad2_final_token_prices: vector::empty<u64>(),
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
            player1_initial_token_sum: player1_token_sum,
            player2_initial_token_sum: player2_token_sum,
            squad1_token_prices: squad1_token_prices,
            squad2_token_prices: squad2_token_prices,
        });
    }

    // Cancel an open bid and refund the creator
    entry fun cancel_bid(
        registry: &mut EscrowRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        bid_id: ID,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(table::contains(&registry.bid_id_to_index, bid_id), EBidNotFound);
        let bid_index = *table::borrow(&registry.bid_id_to_index, bid_id);
        
        // Validate authorization and status
        assert!(vector::borrow(&registry.active_bids, bid_index).creator == sender, common_errors::unauthorized());
        assert!(vector::borrow(&registry.active_bids, bid_index).status == BidStatus::Open, EBidNotFound);

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
        bid_refund_coin.join(fee_refund_coin);
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
    entry fun complete_match(
        signer_cap: &MatchSignerCap,
        registry: &mut EscrowRegistry,
        squad_registry: &mut SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        user_stats_registry: &mut UserStatsRegistry,
        match_id: ID,
        squad1_final_token_prices: vector<u64>, // Final token prices for squad1 at match completion
        squad2_final_token_prices: vector<u64>, // Final token prices for squad2 at match completion
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate signer authorization
        assert!(match_signer::validate_match_signer(signer_cap, ctx), common_errors::unauthorized());
        
        assert!(table::contains(&registry.match_id_to_index, match_id), EMatchNotFound);
        let match_index = *table::borrow(&registry.match_id_to_index, match_id);
        let match_obj = vector::borrow_mut(&mut registry.active_matches, match_index);
        
        // Validate match status
        assert!(match_obj.status == MatchStatus::Active, EMatchNotActive);
        assert!(!match_obj.prize_claimed, EMatchAlreadyCompleted);
        
        // IMPORTANT: Validate that the match time has ended
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= match_obj.ends_at, EMatchNotEndedYet);
        
        // Calculate final token sums for each player using safe math
        let player1_final_sum = calculate_final_token_sum(&squad1_final_token_prices);
        let player2_final_sum = calculate_final_token_sum(&squad2_final_token_prices);

        // Calculate percentage increases using safe math helper
        let player1_percentage = if (match_obj.player1_initial_token_sum > 0) {
            if (player1_final_sum >= match_obj.player1_initial_token_sum) {
                calculate_token_performance(match_obj.player1_initial_token_sum, player1_final_sum)
            } else {
                // Negative percentage (loss) - represent as 0 for now
                0
            }
        } else {
            0 // Avoid division by zero
        };

        let player2_percentage = if (match_obj.player2_initial_token_sum > 0) {
            if (player2_final_sum >= match_obj.player2_initial_token_sum) {
                calculate_token_performance(match_obj.player2_initial_token_sum, player2_final_sum)
            } else {
                // Negative percentage (loss) - represent as 0 for now
                0
            }
        } else {
            0 // Avoid division by zero
        };

        // Determine winner based on highest percentage increase
        let winner = if (player1_percentage > player2_percentage) {
            match_obj.player1
        } else if (player2_percentage > player1_percentage) {
            match_obj.player2
        } else {
            // Tie - could implement tiebreaker logic, for now we will use player1
            match_obj.player1
        };
        
        let loser = if (winner == match_obj.player1) {
            match_obj.player2
        } else {
            match_obj.player1
        };

        // Store match data for stats update
        let prize_amount = match_obj.total_prize;
        let match_duration = match_obj.duration;
        let wager_amount = match_obj.total_prize / 2; // Each player wagered half of total prize

        // Update match with calculated values
        match_obj.status = MatchStatus::Completed;
        match_obj.winner = option::some(winner);
        match_obj.player1_final_token_sum = player1_final_sum;
        match_obj.player2_final_token_sum = player2_final_sum;
        match_obj.player1_percentage_increase = player1_percentage;
        match_obj.player2_percentage_increase = player2_percentage;
        
        // Record final token prices
        match_obj.squad1_final_token_prices = squad1_final_token_prices;
        match_obj.squad2_final_token_prices = squad2_final_token_prices;

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

        // Update user statistics for both players
        user_stats::update_match_stats(
            user_stats_registry,
            winner,
            true, // is_winner
            prize_amount,
            wager_amount,
            match_duration,
            string::utf8(b"1v1_match"),
            clock,
            ctx
        );

        user_stats::update_match_stats(
            user_stats_registry,
            loser,
            false, // is_winner
            0, // prize_amount
            wager_amount,
            match_duration,
            string::utf8(b"1v1_match"),
            clock,
            ctx
        );

        // Emit event with correct fee information
        event::emit(MatchCompleted {
            match_id,
            winner,
            loser,
            prize_amount: match_obj.total_prize,
            total_fees: match_obj.total_fees, // Total fees from both bids
            // Token performance data
            player1_initial_sum: match_obj.player1_initial_token_sum,
            player2_initial_sum: match_obj.player2_initial_token_sum,
            player1_final_sum: player1_final_sum,
            player2_final_sum: player2_final_sum,
            player1_percentage_increase: player1_percentage,
            player2_percentage_increase: player2_percentage,
            squad1_final_token_prices: match_obj.squad1_final_token_prices,
            squad2_final_token_prices: match_obj.squad2_final_token_prices,
        });
    }

    // Claim prize after winning a match
    entry fun claim_prize(
        signer_cap: &MatchSignerCap,
        registry: &mut EscrowRegistry,
        fees: &mut Fees,
        match_id: ID,
        ctx: &mut TxContext
    ) {
        // Validate signer authorization
        assert!(match_signer::validate_match_signer(signer_cap, ctx), common_errors::unauthorized());
        
        assert!(table::contains(&registry.match_id_to_index, match_id), EMatchNotFound);
        let match_index = *table::borrow(&registry.match_id_to_index, match_id);
        
        // Get all needed data before mutable borrow
        let (bid1_id, bid2_id, total_prize, fees_collected, total_fees, winner_addr);
        {
            let match_obj = vector::borrow(&registry.active_matches, match_index);
            
            // Validate claiming of the prize
            assert!(match_obj.status == MatchStatus::Completed, EMatchNotActive);
            assert!(!match_obj.prize_claimed, EMatchAlreadyCompleted);
            assert!(option::is_some(&match_obj.winner), EMatchNotActive);

            bid1_id = match_obj.bid1_id;
            bid2_id = match_obj.bid2_id;
            total_prize = match_obj.total_prize;
            fees_collected = match_obj.fees_collected;
            total_fees = match_obj.total_fees;
            winner_addr = *option::borrow(&match_obj.winner);
        };

        // Get the original bid to access escrow and fees
        let bid_index = *table::borrow(&registry.bid_id_to_index, bid1_id);
        let bid = vector::borrow_mut(&mut registry.active_bids, bid_index);
        
        // Transfer prize to winner
        let prize_balance = balance::withdraw_all(&mut bid.escrow);
        let prize_coin = coin::from_balance(prize_balance, ctx);
        transfer::public_transfer(prize_coin, winner_addr);
        
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

        // Move match from active to completed Storage
        move_match_to_completed(registry, match_id);

        // Move bid from active to completed Storage
        move_bid_to_completed(registry, bid1_id);
        move_bid_to_completed(registry, bid2_id);

        // Emit event
        event::emit(PrizeClaimed {
            match_id,
            winner: winner_addr,
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

    // Helper function to check if a match has ended (time-based)
    public fun has_match_ended(match_obj: &Match, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);
        current_time >= match_obj.ends_at
    }

    // Helper function to check if match can be completed
    public fun can_complete_match(registry: &EscrowRegistry, match_id: ID, clock: &Clock): bool {
        if (!table::contains(&registry.match_id_to_index, match_id)) {
            return false
        };
        
        let match_index = *table::borrow(&registry.match_id_to_index, match_id);
        let match_obj = vector::borrow(&registry.active_matches, match_index);
        
        match_obj.status == MatchStatus::Active && 
        !match_obj.prize_claimed && 
        has_match_ended(match_obj, clock)
    }

    // Token price getter functions
    public fun get_match_squad1_start_prices(match_obj: &Match): &vector<u64> {
        &match_obj.squad1_token_prices
    }

    public fun get_match_squad2_start_prices(match_obj: &Match): &vector<u64> {
        &match_obj.squad2_token_prices
    }

    public fun get_match_squad1_final_prices(match_obj: &Match): &vector<u64> {
        &match_obj.squad1_final_token_prices
    }

    public fun get_match_squad2_final_prices(match_obj: &Match): &vector<u64> {
        &match_obj.squad2_final_token_prices
    }

    // Helper function to check if token prices have been recorded for a match
    public fun has_final_prices_recorded(match_obj: &Match): bool {
        !vector::is_empty(&match_obj.squad1_final_token_prices) && 
        !vector::is_empty(&match_obj.squad2_final_token_prices)
    }

    // Token performance getter functions
    public fun get_player1_initial_token_sum(match_obj: &Match): u64 {
        match_obj.player1_initial_token_sum
    }

    public fun get_player2_initial_token_sum(match_obj: &Match): u64 {
        match_obj.player2_initial_token_sum
    }

    public fun get_player1_final_token_sum(match_obj: &Match): u64 {
        match_obj.player1_final_token_sum
    }

    public fun get_player2_final_token_sum(match_obj: &Match): u64 {
        match_obj.player2_final_token_sum
    }

    public fun get_player1_percentage_increase(match_obj: &Match): u64 {
        match_obj.player1_percentage_increase
    }

    public fun get_player2_percentage_increase(match_obj: &Match): u64 {
        match_obj.player2_percentage_increase
    }

    // Helper function to get percentage increase as a human-readable percentage (0-10000 scale)
    // Example: 1500 = 15.00%
    public fun get_percentage_increase_for_player(match_obj: &Match, player: address): u64 {
        if (player == match_obj.player1) {
            match_obj.player1_percentage_increase
        } else if (player == match_obj.player2) {
            match_obj.player2_percentage_increase
        } else {
            0 // Player not in this match
        }

    }

    // Helper function to check if a player won based on percentage increase
    public fun did_player_win_by_percentage(match_obj: &Match, player: address): bool {
        if (option::is_none(&match_obj.winner)) {
            return false
        };
        
        let winner = *option::borrow(&match_obj.winner);
        winner == player
    }

    // Calculate total prize pool for a match
    public fun calculate_total_prize(bid_amount: u64): u64 {
        math_utils::calculate_prize_pool(bid_amount)
    }

    // Calculate initial token sum for a match
    fun calculate_initial_token_sum(token_prices: &vector<u64>): u64 {
        math_utils::safe_sum_vector(token_prices)
    }

    // Calculate final token sum for completed match
    fun calculate_final_token_sum(token_prices: &vector<u64>): u64 {
        math_utils::safe_sum_vector(token_prices)
    }

    // Calculate percentage increase between initial and final sums
    fun calculate_token_performance(initial_sum: u64, final_sum: u64): u64 {
        math_utils::calculate_percentage_increase(initial_sum, final_sum)
    }

}

