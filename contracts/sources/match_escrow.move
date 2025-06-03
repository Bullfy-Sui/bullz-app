#[allow(duplicate_alias,unused_use)]

module bullfy::match_escrow {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use std::option::{Self, Option};
    use std::vector;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use bullfy::admin::AdminCap;

    // Error codes with descriptive messages
    #[error]
    const ENotOwner: vector<u8> = b"Only the owner can perform this action";
    #[error]
    const EMatchNotFound: vector<u8> = b"Match not found in the queue";
    #[error]
    const EInsufficientBid: vector<u8> = b"Bid amount is below the minimum required";
    #[error]
    const EMatchAlreadyCompleted: vector<u8> = b"Match has already been completed or is not in waiting state";

    // Status enum for match state
    public enum Status has copy, drop, store {
        Waiting,
        Matched,
        Completed,
        Cancelled
    }

    // Minimum bid amount required to enter a match
    const MIN_BID_AMOUNT: u64 = 10000000; // 0.01 SUI in MIST

    public struct Escrow has key, store {
        id: UID,
        player: address,
        amount: Balance<SUI>,
        created_at: u64, // Timestamp in milliseconds
        status: Status, // Using the Status enum instead of u8
    }

    public struct MatchQueue has key {
        id: UID,
        waiting: Table<u64, Escrow>,
        counter: u64,
    }

    // Events
    public struct MatchEntered has copy, drop {
        match_id: u64,
        player: address,
        amount: u64,
    }

    public struct MatchCompleted has copy, drop {
        match_id: u64,
        player: address,
        amount: u64,
    }

    public struct BidRetrieved has copy, drop {
        match_id: u64,
        player: address,
        recipient: address,
        amount: u64,
    }
    
    
     
    fun init(ctx: &mut TxContext) {
        let queue = MatchQueue {
            id: object::new(ctx),
            waiting: table::new(ctx),
            counter: 0,
        };
        
        // Share object so it can be accessed by other transactions
        transfer::share_object(queue);
    }

    public fun enter_match(
        queue: &mut MatchQueue,
        bid: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): u64 {
        // Check minimum bid amount
        let bid_amount = coin::value(&bid);
        assert!(bid_amount >= MIN_BID_AMOUNT, EInsufficientBid);
        
        let sender = tx_context::sender(ctx);
        let match_id = queue.counter;
        let timestamp = clock::timestamp_ms(clock);
        
        let escrow = Escrow {
            id: object::new(ctx),
            player: sender,
            amount: coin::into_balance(bid),
            created_at: timestamp,
            status: Status::Waiting, // Using enum variant instead of constant
        };
        
        table::add(&mut queue.waiting, match_id, escrow);
        queue.counter = match_id + 1;
        
        // Emit event
        event::emit(MatchEntered {
            match_id,
            player: sender,
            amount: bid_amount,
        });
        
        match_id
    }

    // Retrieve bid function for players
    public fun retrieve_bid_player(
        queue: &mut MatchQueue,
        match_id: u64,
        ctx: &mut TxContext
    ) {
        // Check if match exists
        assert!(table::contains(&queue.waiting, match_id), EMatchNotFound);
        
        // Get the escrow
        let escrow = table::borrow(&queue.waiting, match_id);
        let player = escrow.player;
        let sender = tx_context::sender(ctx);
        
        // Only the player can retrieve
        assert!(sender == player, ENotOwner);
        
        // Get escrow and validate status
        let mut escrow = table::remove(&mut queue.waiting, match_id);
        
        // Check if the status is Waiting using pattern matching
        match (escrow.status) {
            Status::Waiting => {
                let recipient = player; // Always return to the original player
                let amount_value = balance::value(&escrow.amount);
                
                // Transfer funds back - extract balance before destructuring
                let bal = balance::withdraw_all(&mut escrow.amount);
                let coin_to_return = coin::from_balance(bal, ctx);
                
                // Clean up escrow - destroy the no longer needed struct fields
                let Escrow { id, player: _, amount, created_at: _, status: _ } = escrow;
                balance::destroy_zero(amount);
                object::delete(id);
                
                transfer::public_transfer(coin_to_return, recipient);
                
                // Emit event
                event::emit(BidRetrieved {
                    match_id,
                    player,
                    recipient,
                    amount: amount_value,
                });
            },
            _ => abort EMatchAlreadyCompleted
        }
    }
    
    // Retrieve bid function for admins (with AdminCap)
    public fun retrieve_bid_admin(
        _admin_cap: &AdminCap,
        queue: &mut MatchQueue,
        match_id: u64,
        ctx: &mut TxContext
    ) {
        // Check if match exists
        assert!(table::contains(&queue.waiting, match_id), EMatchNotFound);
        
        // Get the escrow
        let escrow = table::borrow(&queue.waiting, match_id);
        let player = escrow.player;
        
        // Get escrow and validate status
        let mut escrow = table::remove(&mut queue.waiting, match_id);
        
        // Check if the status is Waiting using pattern matching
        match (escrow.status) {
            Status::Waiting => {
                let recipient = player; // Always return to the original player
                let amount_value = balance::value(&escrow.amount);
                
                // Transfer funds back - extract balance before destructuring
                let bal = balance::withdraw_all(&mut escrow.amount);
                let coin_to_return = coin::from_balance(bal, ctx);
                
                // Clean up escrow - destroy the no longer needed struct fields
                let Escrow { id, player: _, amount, created_at: _, status: _ } = escrow;
                balance::destroy_zero(amount);
                object::delete(id);
                
                transfer::public_transfer(coin_to_return, recipient);
                
                // Emit event
                event::emit(BidRetrieved {
                    match_id,
                    player,
                    recipient,
                    amount: amount_value,
                });
            },
            _ => abort EMatchAlreadyCompleted
        }
    }

    // Public entry function for retrieve_bid for player
    public entry fun retrieve_bid_player_entry(
        queue: &mut MatchQueue,
        match_id: u64,
        ctx: &mut TxContext
    ) {
        retrieve_bid_player(queue, match_id, ctx);
    }
    
    // Public entry function for retrieve_bid with AdminCap
    public entry fun retrieve_bid_admin_entry(
        admin_cap: &AdminCap,
        queue: &mut MatchQueue,
        match_id: u64,
        ctx: &mut TxContext
    ) {
        retrieve_bid_admin(admin_cap, queue, match_id, ctx);
    }
    
    // Complete a match and transfer funds to winner
    public entry fun complete_match(
        _admin_cap: &AdminCap,
        queue: &mut MatchQueue,
        match_id: u64,
        winner: address,
        ctx: &mut TxContext
    ) {
        // Check if match exists
        assert!(table::contains(&queue.waiting, match_id), EMatchNotFound);
        
        // Get and remove escrow
        let mut escrow = table::remove(&mut queue.waiting, match_id);
        
        // Check if the status is Waiting
        match (escrow.status) {
            Status::Waiting => {
                let amount_value = balance::value(&escrow.amount);
                let player = escrow.player;
                
                // Update status
                escrow.status = Status::Completed; 
                
                // Extract the funds - extract balance before destructuring
                let bal = balance::withdraw_all(&mut escrow.amount);
                let coin_to_transfer = coin::from_balance(bal, ctx);
                
                // Clean up escrow
                let Escrow { id, player: _, amount, created_at: _, status: _ } = escrow;
                balance::destroy_zero(amount);
                object::delete(id);
                
                // Transfer to winner
                transfer::public_transfer(coin_to_transfer, winner);
                
                // Emit event
                event::emit(MatchCompleted {
                    match_id,
                    player,
                    amount: amount_value,
                });
            },
            _ => abort EMatchAlreadyCompleted
        }
    }
    
    // View functions
    public fun get_match_info(queue: &MatchQueue, match_id: u64): (address, u64, u64, Status) {
        assert!(table::contains(&queue.waiting, match_id), EMatchNotFound);
        
        let escrow = table::borrow(&queue.waiting, match_id);
        (escrow.player, balance::value(&escrow.amount), escrow.created_at, escrow.status)
    }
    
    public fun get_waiting_count(queue: &MatchQueue): u64 {
        table::length(&queue.waiting)
    }

    // Add public entry function that exposes the enter_match functionality
    public entry fun enter_match_entry(
        queue: &mut MatchQueue,
        bid: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let _ = enter_match(queue, bid, clock, ctx);
    }
}