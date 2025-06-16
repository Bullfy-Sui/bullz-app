module bullfy::fee_calculator {
    use bullfy::admin::{Self, FeeConfig};

    // Calculate upfront fee and total required payment
    public fun calculate_upfront_fee(
        base_amount: u64,
        fee_config: &FeeConfig
    ): (u64, u64) {
        let fee_amount = (base_amount * admin::get_upfront_fee_bps(fee_config)) / 100;
        let total_required = base_amount + fee_amount;
        (fee_amount, total_required)
    }

    // Calculate just the fee amount
    public fun calculate_fee_amount(
        base_amount: u64,
        fee_config: &FeeConfig
    ): u64 {
        (base_amount * admin::get_upfront_fee_bps(fee_config)) / 100
    }

    // Calculate total required payment (base + fee)
    public fun calculate_total_payment(
        base_amount: u64,
        fee_config: &FeeConfig
    ): u64 {
        let fee_amount = calculate_fee_amount(base_amount, fee_config);
        base_amount + fee_amount
    }

    // Get fee basis points from config
    public fun get_fee_bps(fee_config: &FeeConfig): u64 {
        admin::get_upfront_fee_bps(fee_config)
    }
}