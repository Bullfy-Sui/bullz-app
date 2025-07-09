module bullfy::payment_utils {
    use sui::coin::Coin;
    use sui::sui::SUI;
    use bullfy::common_errors;
    use bullfy::math_utils;

    // Handle payment with fee, splitting into main and fee portions
    public fun handle_payment_with_fee(
        mut payment: Coin<SUI>,
        main_amount: u64,
        fee_amount: u64,
        payer: address,
        ctx: &mut TxContext
    ): (Coin<SUI>, Coin<SUI>) {
        let payment_amount = payment.value();
        
        // Calculate total required using safe math
        let total_required = math_utils::safe_add(main_amount, fee_amount);
        
        // Validate sufficient payment
        assert!(payment_amount >= total_required, common_errors::insufficient_payment());
        
        // Handle exact payment case
        if (payment_amount == total_required) {
            let fee_coin = payment.split(fee_amount, ctx);
            return (payment, fee_coin) // payment now contains main_amount
        };
        
        // Handle overpayment case
        if (payment_amount > total_required) {
            let fee_coin = payment.split(fee_amount, ctx);
            let main_coin = payment.split(main_amount, ctx);
            sui::transfer::public_transfer(payment, payer); // Return change
            return (main_coin, fee_coin)
        };
        
        // This should never be reached due to the assert above
        abort common_errors::insufficient_payment()
    }

    // Calculate total required payment (main + fee)
    public fun calculate_total_required(main_amount: u64, fee_amount: u64): u64 {
        math_utils::safe_add(main_amount, fee_amount)
    }

    // Validate payment amount is sufficient
    public fun validate_payment_amount(payment_amount: u64, required_amount: u64) {
        assert!(payment_amount >= required_amount, common_errors::insufficient_payment());
    }
} 