#[allow(duplicate_alias,unused_const,lint(self_transfer))]
module bullfy::fee_collector {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self};
    use sui::transfer;
    use sui::sui::SUI;
    use sui::event;
    use sui::balance::Balance;
    use bullfy::admin::AdminCap;

    // Error codes with descriptive messages
    #[error]
    const ENotAdmin: vector<u8> = b"Only the admin can perform this action";
    #[error]
    const EInsufficientBalance: vector<u8> = b"Insufficient balance for withdrawal";

    public struct Fees has key {
        id: UID,
        total: Balance<SUI>,
    }

    // Event emitted when fees are collected
    public struct FeeCollected has copy, drop {
        amount: u64,
        collector: address,
    }

    // Event emitted when fees are withdrawn
    public struct FeeWithdrawn has copy, drop {
        amount: u64,
        recipient: address,
    }

    // Init function must be public and named 'init'
    fun init(ctx: &mut TxContext) {
        let fees = Fees {
            id: object::new(ctx),
            total: balance::zero<SUI>(),
        };
        
        // Share object so it can be accessed by other transactions
        transfer::share_object(fees);
    }

    public fun collect(fees: &mut Fees, incoming: Coin<SUI>, ctx: &mut TxContext) {
        let amount = coin::value(&incoming);
        let coin_balance = coin::into_balance(incoming);
        balance::join(&mut fees.total, coin_balance);
        
        // Emit event
        event::emit(FeeCollected {
            amount,
            collector: tx_context::sender(ctx),
        });
    }

    public fun withdraw(_: &AdminCap, fees: &mut Fees, amount: u64, recipient: address, ctx: &mut TxContext) {
        // Check that there's enough balance
        let current_balance = balance::value(&fees.total);
        assert!(current_balance >= amount, EInsufficientBalance);
        
        // Extract and transfer coins
        let withdrawn_balance = balance::split(&mut fees.total, amount);
        let withdrawn = coin::from_balance(withdrawn_balance, ctx);
        transfer::public_transfer(withdrawn, recipient);
        
        // Emit event
        event::emit(FeeWithdrawn {
            amount,
            recipient,
        });
    }
    
    // Allow admin to withdraw all fees at once
    public fun withdraw_all(_: &AdminCap, fees: &mut Fees, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let amount = balance::value(&fees.total);
        assert!(amount > 0, EInsufficientBalance);
        
        // Extract and transfer all coins
        let withdrawn_balance = balance::split(&mut fees.total, amount);
        let withdrawn = coin::from_balance(withdrawn_balance, ctx);
        transfer::public_transfer(withdrawn, sender);
        
        // Emit event
        event::emit(FeeWithdrawn {
            amount,
            recipient: sender,
        });
    }
    
    // Function to check the total collected fees
    public fun get_total(fees: &Fees): u64 {
        balance::value(&fees.total)
    }
}