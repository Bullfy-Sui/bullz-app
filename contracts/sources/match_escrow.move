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
    const E_BID_EXPIRED: vector<u8> = b"Bid has expired";
    #[error]
    const E_CANNOT_MATCH_OWN_BID: vector<u8> = b"Cannot match your own bid";
    #[error]
    const E_INSUFFICIENT_PAYMENT: vector<u8> = b"Payment amount is insufficient";
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
    const MIN_DURATION: u64 = 300_000; // 5 minutes in milliseconds
    const MAX_DURATION: u64 = 604_800_000; // 7 days in milliseconds
    const PLATFORM_FEE_BPS: u64 = 250; // 2.5% platform fee
    const BID_EXPIRY_TIME: u64 = 86_400_000; // 24 hours in milliseconds

    // Bid status enum
    public enum BidStatus has copy, drop, store {
        Open,      // Available for matching
        Matched,   // Matched and match is active
        Expired,   // Expired without being matched
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
        expires_at: u64,
        status: BidStatus,
        description: String, // Optional description/challenge message
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

    // Registry for bids and matches (no longer tracks active squads)
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
        expires_at: u64,
        description: String,
    }

    public struct BidMatched has copy, drop {
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

    public struct BidExpired has copy, drop {
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
        description: String,
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

        // Check if squad is already active using existing function
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
            expires_at: current_time + BID_EXPIRY_TIME,
            status: BidStatus::Open,
            description,
        };

        let bid_id = object::id(&bid);

        // Add to registry
        table::add(&mut registry.bids, bid_id, bid);

        // Register squad as active using existing registry
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
            expires_at: current_time + BID_EXPIRY_TIME,
            description,
        });
    }

    // Match an existing bid by creating a counter-bid
    public entry fun match_bid(
        registry: &mut EscrowRegistry,
        squad_registry: &mut SquadRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        fees: &mut Fees,
        target_bid_id: ID,
        squad_id: u64,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let matcher = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Get the target bid
        assert!(table::contains(&registry.bids, target_bid_id), E_BID_NOT_FOUND);
        let target_bid = table::borrow_mut(&mut registry.bids, target_bid_id);

        // Validate bid status and expiry
        assert!(target_bid.status == BidStatus::Open, E_BID_NOT_FOUND);
        assert!(current_time <= target_bid.expires_at, E_BID_EXPIRED);
        assert!(target_bid.creator != matcher, E_CANNOT_MATCH_OWN_BID);

        // Validate squad ownership and status
        let squad = squad_manager::get_squad(squad_registry, squad_id);
        assert!(squad_manager::get_squad_owner(squad) == matcher, E_SQUAD_NOT_OWNED);
        assert!(squad_manager::is_squad_alive(squad), E_SQUAD_NOT_ALIVE);

        // Check if squad is already active using existing function
        assert!(!squad_player_challenge::is_squad_active(active_squad_registry, squad_id), E_SQUAD_ALREADY_ACTIVE);

        // Validate payment matches bid amount
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= target_bid.bid_amount, E_INSUFFICIENT_PAYMENT);

        // Handle payment
        let mut match_payment = if (payment_amount == target_bid.bid_amount) {
            coin::into_balance(payment)
        } else {
            let match_coin = coin::split(&mut payment, target_bid.bid_amount, ctx);
            transfer::public_transfer(payment, matcher); // Return change
            coin::into_balance(match_coin)
        };

        // Calculate fees and prize
        let total_bids = target_bid.bid_amount * 2;
        let platform_fee = (total_bids * PLATFORM_FEE_BPS) / 10000;
        let total_prize = total_bids - platform_fee;

        // Create match
        let match_obj = Match {
            id: object::new(ctx),
            bid1_id: target_bid_id,
            bid2_id: object::id_from_address(@0x0), // Placeholder for second bid
            player1: target_bid.creator,
            player2: matcher,
            squad1_id: target_bid.squad_id,
            squad2_id: squad_id,
            total_prize,
            platform_fee,
            duration: target_bid.duration,
            started_at: current_time,
            ends_at: current_time + target_bid.duration,
            status: MatchStatus::Active,
            winner: option::none(),
            prize_claimed: false,
        };

        let match_id = object::id(&match_obj);

        // Update target bid status
        target_bid.status = BidStatus::Matched;

        // Update active squads registry - remove first squad from bid tracking, add both to match tracking
        squad_player_challenge::unregister_squad_active(active_squad_registry, target_bid.squad_id);
        squad_player_challenge::register_squad_active(active_squad_registry, target_bid.squad_id, match_id);
        squad_player_challenge::register_squad_active(active_squad_registry, squad_id, match_id);

        // Collect platform fees
        let fee_balance1 = balance::split(&mut target_bid.escrow, platform_fee / 2);
        let fee_balance2 = balance::split(&mut match_payment, platform_fee / 2);
        let mut total_fee_balance = fee_balance1;
        balance::join(&mut total_fee_balance, fee_balance2);
        let fee_coin = coin::from_balance(total_fee_balance, ctx);
        fee_collector::collect(fees, fee_coin, ctx);

        // Combine remaining balances for prize pool
        balance::join(&mut target_bid.escrow, match_payment);

        // Add match to registry
        table::add(&mut registry.matches, match_id, match_obj);

        // Track user matches
        let users = vector[target_bid.creator, matcher];
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
        event::emit(BidMatched {
            bid1_id: target_bid_id,
            bid2_id: object::id_from_address(@0x0), // Placeholder
            match_id,
            player1: target_bid.creator,
            player2: matcher,
            squad1_id: target_bid.squad_id,
            squad2_id: squad_id,
            total_prize,
            duration: target_bid.duration,
            ends_at: current_time + target_bid.duration,
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
        ctx: &mut TxContext
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

    // Expire old bids and refund creators (can be called by anyone)
    public entry fun expire_bid(
        registry: &mut EscrowRegistry,
        active_squad_registry: &mut ActiveSquadRegistry,
        bid_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.bids, bid_id), E_BID_NOT_FOUND);
        let bid = table::borrow_mut(&mut registry.bids, bid_id);
        
        // Check if bid is expired and still open
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time > bid.expires_at, E_BID_NOT_FOUND);
        assert!(bid.status == BidStatus::Open, E_BID_NOT_FOUND);

        // Update status and refund
        bid.status = BidStatus::Expired;
        let refund_amount = balance::value(&bid.escrow);
        let refund_balance = balance::withdraw_all(&mut bid.escrow);
        let refund_coin = coin::from_balance(refund_balance, ctx);
        transfer::public_transfer(refund_coin, bid.creator);

        // Remove squad from active registry
        squad_player_challenge::unregister_squad_active(active_squad_registry, bid.squad_id);

        // Emit event
        event::emit(BidExpired {
            bid_id,
            creator: bid.creator,
            refund_amount,
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
    public fun is_bid_valid(bid: &Bid, clock: &Clock): bool {
        bid.status == BidStatus::Open && clock::timestamp_ms(clock) <= bid.expires_at
    }
}
