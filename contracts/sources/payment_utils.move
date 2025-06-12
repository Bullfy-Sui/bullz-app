module bullfy::payment_utils {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use bullfy::common_errors;

    // Handle payment with fee splitting and change return
    public fun handle_payment_with_fee(
        mut payment: Coin<SUI>,
        main_amount: u64,
        fee_amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ): (Coin<SUI>, Coin<SUI>) {
        let payment_amount = coin::value(&payment);
        let total_required = main_amount + fee_amount;
        assert!(payment_amount >= total_required, common_errors::insufficient_payment());
        
        if (payment_amount == total_required) {
            // Exact payment - split into main and fee
            let fee_coin = coin::split(&mut payment, fee_amount, ctx);
            (payment, fee_coin)
        } else {
            // Overpaid - split exact amounts and return change
            let fee_coin = coin::split(&mut payment, fee_amount, ctx);
            let main_coin = coin::split(&mut payment, main_amount, ctx);
            sui::transfer::public_transfer(payment, recipient); // Return change
            (main_coin, fee_coin)
        }
    }

    // Validate payment amount against required amount
    public fun validate_payment_amount(payment_amount: u64, required_amount: u64) {
        assert!(payment_amount >= required_amount, common_errors::insufficient_payment());
    }

    // Check if payment amount is sufficient (returns bool)
    public fun is_payment_sufficient(payment_amount: u64, required_amount: u64): bool {
        payment_amount >= required_amount
    }

    // Calculate total required payment (main + fee)
    public fun calculate_total_required(main_amount: u64, fee_amount: u64): u64 {
        main_amount + fee_amount
    }
} 