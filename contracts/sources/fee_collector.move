#[allow(lint(self_transfer))]

module bullfy::fee_collector {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;
    use bullfy::admin::AdminCap;
    use bullfy::common_errors;

    public struct Fees has key {
        id: UID,
        total_balance: Balance<SUI>,
        total_collected: u64,
    }

    // Event emitted when fees are collected
    public struct FeeCollected has copy, drop {
        collector: address,
        amount: u64,
        total_collected: u64,
    }

    // Event emitted when fees are withdrawn
    public struct FeeWithdrawn has copy, drop {
        recipient: address,
        amount: u64,
        remaining_balance: u64,
    }

    // Init function must be public and named 'init'
    fun init(ctx: &mut TxContext) {
        let fees = Fees {
            id: object::new(ctx),
            total_balance: balance::zero<SUI>(),
            total_collected: 0,
        };
        
        // Share object so it can be accessed by other transactions
        transfer::share_object(fees);
    }

    // Collect fees from an incoming coin
    public fun collect(fees: &mut Fees, incoming: Coin<SUI>, _ctx: &mut TxContext) {
        let amount = incoming.value();
        let coin_balance = incoming.into_balance();
        
        balance::join(&mut fees.total_balance, coin_balance);
        fees.total_collected = fees.total_collected + amount;
        
        event::emit(FeeCollected {
            collector: object::id_address(fees),
            amount,
            total_collected: fees.total_collected,
        });
    }

    // Withdraw a specific amount from collected fees (admin only)
    public fun withdraw(
        _admin_cap: &AdminCap,
        fees: &mut Fees,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(balance::value(&fees.total_balance) >= amount, common_errors::insufficient_payment());
        
        let withdrawn_balance = balance::split(&mut fees.total_balance, amount);
        let withdrawn = coin::from_balance(withdrawn_balance, ctx);
        
        transfer::public_transfer(withdrawn, recipient);
        
        event::emit(FeeWithdrawn {
            recipient,
            amount,
            remaining_balance: balance::value(&fees.total_balance),
        });
    }

    // Withdraw all collected fees (admin only)
    public fun withdraw_all(
        _admin_cap: &AdminCap,
        fees: &mut Fees,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let amount = balance::value(&fees.total_balance);
        let withdrawn_balance = balance::withdraw_all(&mut fees.total_balance);
        let withdrawn = coin::from_balance(withdrawn_balance, ctx);
        
        transfer::public_transfer(withdrawn, recipient);
        
        event::emit(FeeWithdrawn {
            recipient,
            amount,
            remaining_balance: 0,
        });
    }
    
    // Function to check the total collected fees
    public fun get_total_balance(fees: &Fees): u64 {
        balance::value(&fees.total_balance)
    }

    // Function to check the total collected amount
    public fun get_total_collected(fees: &Fees): u64 {
        fees.total_collected
    }
}