module bullfy::fee_calculator {
    use bullfy::admin::{Self, FeeConfig};
    use bullfy::math_utils;

    // Calculate upfront fee and total required payment
    public fun calculate_upfront_fee(
        base_amount: u64,
        fee_config: &FeeConfig
    ): (u64, u64) {
        math_utils::calculate_platform_fee(base_amount, fee_config)
    }

    // Calculate just the fee amount
    public fun calculate_fee_amount(
        base_amount: u64,
        fee_config: &FeeConfig
    ): u64 {
        let (fee_amount, _) = calculate_upfront_fee(base_amount, fee_config);
        fee_amount
    }

    // Calculate total required payment (base + fee)
    public fun calculate_total_payment(
        base_amount: u64,
        fee_config: &FeeConfig
    ): u64 {
        let (_, total_required) = calculate_upfront_fee(base_amount, fee_config);
        total_required
    }

    // Get fee basis points from config
    public fun get_fee_bps(fee_config: &FeeConfig): u64 {
        admin::get_upfront_fee_bps(fee_config)
    }
} 