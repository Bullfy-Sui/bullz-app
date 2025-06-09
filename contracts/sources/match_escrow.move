module bullfy::match_escrow {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use std::vector;
    use bullfy::squad_manager::{Self, SquadRegistry};
    use bullfy::fee_collector::{Self, Fees};
    use bullfy::squad_player_challenge::{Self, ActiveSquadRegistry};

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
    const PLATFORM_FEE_BPS: u64 = 250; // 2.5% platform fee

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
        total_prize: u64, // Total prize pool (both bids minus fees)
        platform_fee: u64, // Platform fee amount
        duration: u64,
        started_at: u64,
        ends_at: u64,
        status: MatchStatus,
        winner: Option<address>,
        prize_claimed: bool,
    }

    // Registry for bids and matches
    public struct EscrowRegistry has key {
        id: UID,
        bids: Table<ID, Bid>,
        matches: Table<ID, Match>,
        user_bids: Table<address, vector<ID>>, // Track user's bids
        user_matches: Table<address, vector<ID>>, // Track user's matches
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
        platform_fee: u64,
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
            bids: table::new(ctx),
            matches: table::new(ctx),
            user_bids: table::new(ctx),
            user_matches: table::new(ctx),
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

        // Validate payment
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= bid_amount, E_INSUFFICIENT_PAYMENT);

        // Handle payment - take exact bid amount, return change if any
        let escrow_balance = if (payment_amount == bid_amount) {
            coin::into_balance(payment)
        } else {
            let bid_coin = coin::split(&mut payment, bid_amount, ctx);
            transfer::public_transfer(payment, creator); // Return change
            coin::into_balance(bid_coin)
        };

        // Create the bid
        let bid = Bid {
            id: object::new(ctx),
            creator,
            squad_id,
            bid_amount,
            duration,
            escrow: escrow_balance,
            created_at: current_time,
            status: BidStatus::Open,
        };

        let bid_id = object::id(&bid);

        // Add to registry
        table::add(&mut registry.bids, bid_id, bid);

        // Register squad as active
        squad_player_challenge::register_squad_active(active_squad_registry, squad_id, bid_id);

        // Track user's bids
        if (!table::contains(&registry.user_bids, creator)) {
            table::add(&mut registry.user_bids, creator, vector::empty<ID>());
        };
        let user_bids = table::borrow_mut(&mut registry.user_bids, creator);
        vector::push_back(user_bids, bid_id);

        // Emit event
        event::emit(BidCreated {
            bid_id,
            creator,
            squad_id,
            bid_amount,
            duration,
        });
    }

    // Match two specific bids together (called by frontend)
    public entry fun match_bids(
        registry: &mut EscrowRegistry,
        _squad_registry: &SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        fees: &mut Fees,
        bid1_id: ID,
        bid2_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);

        // Validate both bids exist
        assert!(table::contains(&registry.bids, bid1_id), E_BID_NOT_FOUND);
        assert!(table::contains(&registry.bids, bid2_id), E_BID_NOT_FOUND);

        // Get bid info (without mutable borrow first)
        let (bid1_creator, bid1_squad_id, bid1_amount, bid1_duration);
        let (bid2_creator, bid2_squad_id, _bid2_amount, _bid2_duration);
        {
            let bid1 = table::borrow(&registry.bids, bid1_id);
            let bid2 = table::borrow(&registry.bids, bid2_id);

            // Validate bid status and expiry
            assert!(bid1.status == BidStatus::Open, E_BID_NOT_FOUND);
            assert!(bid2.status == BidStatus::Open, E_BID_NOT_FOUND);

            // Validate different creators
            assert!(bid1.creator != bid2.creator, E_CANNOT_MATCH_OWN_BID);

            // Validate matching amounts and durations
            assert!(bid1.bid_amount == bid2.bid_amount, E_BID_AMOUNT_MISMATCH);
            assert!(bid1.duration == bid2.duration, E_DURATION_MISMATCH);

            bid1_creator = bid1.creator;
            bid1_squad_id = bid1.squad_id;
            bid1_amount = bid1.bid_amount;
            bid1_duration = bid1.duration;

            bid2_creator = bid2.creator;
            bid2_squad_id = bid2.squad_id;
            _bid2_amount = bid2.bid_amount;
            _bid2_duration = bid2.duration;
        };

        // Calculate fees and prize
        let total_bids = bid1_amount * 2;
        let platform_fee = (total_bids * PLATFORM_FEE_BPS) / 10000;
        let total_prize = total_bids - platform_fee;

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
            platform_fee,
            duration: bid1_duration,
            started_at: current_time,
            ends_at: current_time + bid1_duration,
            status: MatchStatus::Active,
            winner: option::none(),
            prize_claimed: false,
        };

        let match_id = object::id(&match_obj);

        // Update both bids status and collect fees
        {
            let bid1 = table::borrow_mut(&mut registry.bids, bid1_id);
            bid1.status = BidStatus::Matched;
            
            // Collect platform fees from bid1
            let fee_balance1 = balance::split(&mut bid1.escrow, platform_fee / 2);
            let fee_coin1 = coin::from_balance(fee_balance1, ctx);
            fee_collector::collect(fees, fee_coin1, ctx);
        };

        {
            let bid2 = table::borrow_mut(&mut registry.bids, bid2_id);
            bid2.status = BidStatus::Matched;
            
            // Collect platform fees from bid2
            let fee_balance2 = balance::split(&mut bid2.escrow, platform_fee / 2);
            let fee_coin2 = coin::from_balance(fee_balance2, ctx);
            fee_collector::collect(fees, fee_coin2, ctx);
        };

        // Combine remaining balances for prize pool
        let bid2_remaining_balance = {
            let bid2 = table::borrow_mut(&mut registry.bids, bid2_id);
            balance::withdraw_all(&mut bid2.escrow)
        };
        
        {
            let bid1 = table::borrow_mut(&mut registry.bids, bid1_id);
            balance::join(&mut bid1.escrow, bid2_remaining_balance);
        };

        // Add match to registry
        table::add(&mut registry.matches, match_id, match_obj);

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
            
            if (!table::contains(&registry.user_matches, user)) {
                table::add(&mut registry.user_matches, user, vector::empty<ID>());
            };
            let user_matches = table::borrow_mut(&mut registry.user_matches, user);
            vector::push_back(user_matches, match_id);
            
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
        
        assert!(table::contains(&registry.bids, bid_id), E_BID_NOT_FOUND);
        let bid = table::borrow_mut(&mut registry.bids, bid_id);
        
        // Validate authorization and status
        assert!(bid.creator == sender, E_UNAUTHORIZED);
        assert!(bid.status == BidStatus::Open, E_BID_NOT_FOUND);

        // Update status and refund
        bid.status = BidStatus::Cancelled;
        let refund_amount = balance::value(&bid.escrow);
        let refund_balance = balance::withdraw_all(&mut bid.escrow);
        let refund_coin = coin::from_balance(refund_balance, ctx);
        transfer::public_transfer(refund_coin, sender);

        // Remove squad from active registry
        squad_player_challenge::unregister_squad_active(active_squad_registry, bid.squad_id);

        // Emit event
        event::emit(BidCancelled {
            bid_id,
            creator: sender,
            refund_amount,
        });
    }

    // Complete a match by declaring a winner (this would typically be called by an oracle or admin)
    public entry fun complete_match(
        registry: &mut EscrowRegistry,
        squad_registry: &mut SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        match_id: ID,
        winner: address,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.matches, match_id), E_MATCH_NOT_FOUND);
        let match_obj = table::borrow_mut(&mut registry.matches, match_id);
        
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

        // Emit event
        event::emit(MatchCompleted {
            match_id,
            winner,
            loser,
            prize_amount: match_obj.total_prize,
            platform_fee: match_obj.platform_fee,
        });
    }

    // Claim prize after winning a match
    public entry fun claim_prize(
        registry: &mut EscrowRegistry,
        match_id: ID,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(table::contains(&registry.matches, match_id), E_MATCH_NOT_FOUND);
        let match_obj = table::borrow_mut(&mut registry.matches, match_id);
        
        // Validate claim
        assert!(match_obj.status == MatchStatus::Completed, E_MATCH_NOT_ACTIVE);
        assert!(!match_obj.prize_claimed, E_MATCH_ALREADY_COMPLETED);
        assert!(option::contains(&match_obj.winner, &sender), E_UNAUTHORIZED);

        // Get the original bid to access escrow
        let bid = table::borrow_mut(&mut registry.bids, match_obj.bid1_id);
        
        // Transfer prize
        let prize_balance = balance::withdraw_all(&mut bid.escrow);
        let prize_coin = coin::from_balance(prize_balance, ctx);
        transfer::public_transfer(prize_coin, sender);
        
        // Mark as claimed
        match_obj.prize_claimed = true;

        // Emit event
        event::emit(PrizeClaimed {
            match_id,
            winner: sender,
            amount: match_obj.total_prize,
        });
    }

    // View functions
    public fun get_bid(registry: &EscrowRegistry, bid_id: ID): &Bid {
        table::borrow(&registry.bids, bid_id)
    }

    public fun get_match(registry: &EscrowRegistry, match_id: ID): &Match {
        table::borrow(&registry.matches, match_id)
    }

    public fun get_user_bids(registry: &EscrowRegistry, user: address): &vector<ID> {
        table::borrow(&registry.user_bids, user)
    }

    public fun get_user_matches(registry: &EscrowRegistry, user: address): &vector<ID> {
        table::borrow(&registry.user_matches, user)
    }

    // Helper function to check if bid is still valid
    public fun is_bid_valid(bid: &Bid, _clock: &Clock): bool {
        bid.status == BidStatus::Open
    }

    // Get all open bids (for frontend to display and match)
    public fun get_all_open_bids(_registry: &EscrowRegistry): vector<ID> {
        // This is a simple implementation - in production you might want pagination
        let open_bids = vector::empty<ID>();
        // Note: This would require iterating through all bids, which is not efficient
        // In practice, you'd want to maintain a separate index of open bids
        // For now, frontend can query user bids and filter by status
        open_bids
    }
}
