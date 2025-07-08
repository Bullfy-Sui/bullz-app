module bullfy::math_utils {
    use bullfy::admin::{Self, FeeConfig};

    // Error codes
    const E_CALCULATION_OVERFLOW: u64 = 8001;
    const E_DIVISION_BY_ZERO: u64 = 8002;
    const E_RESULT_TOO_LARGE: u64 = 8003;

    // Constants for high-precision calculations
    const BASIS_POINTS: u256 = 10000;
    const PERCENTAGE_MULTIPLIER: u256 = 10000;  // For 0.01% precision
    const MAX_U64: u256 = 18446744073709551615; // 2^64 - 1

    /// Check if a u256 value can safely fit in u64
    public fun is_safe_u64(value: u256): bool {
        value <= MAX_U64
    }

    /// Safe conversion from u256 to u64 with overflow check
    public fun safe_cast_to_u64(value: u256): u64 {
        assert!(is_safe_u64(value), E_RESULT_TOO_LARGE);
        (value as u64)
    }

    /// Calculate fee amount using u256 precision
    /// Returns (fee_amount, total_required) both safely cast to u64
    public fun calculate_fee_amounts(
        base_amount: u64,
        fee_bps: u64
    ): (u64, u64) {
        let base_256 = (base_amount as u256);
        let fee_bps_256 = (fee_bps as u256);
        
        // Calculate fee with overflow protection
        let fee_amount_256 = (base_256 * fee_bps_256) / BASIS_POINTS;
        let total_required_256 = base_256 + fee_amount_256;
        
        // Safe casting with overflow checks
        let fee_amount = safe_cast_to_u64(fee_amount_256);
        let total_required = safe_cast_to_u64(total_required_256);
        
        (fee_amount, total_required)
    }

    /// Calculate percentage increase using u256 precision
    /// Returns percentage * 10000 for 0.01% precision (e.g., 15.23% = 152300)
    public fun calculate_percentage_increase(
        initial_value: u64,
        final_value: u64
    ): u64 {
        assert!(final_value >= initial_value, E_CALCULATION_OVERFLOW);
        assert!(initial_value > 0, E_DIVISION_BY_ZERO);
        
        let initial_256 = (initial_value as u256);
        let final_256 = (final_value as u256);
        let difference = final_256 - initial_256;
        
        // Calculate percentage with high precision
        let percentage_256 = (difference * PERCENTAGE_MULTIPLIER) / initial_256;
        
        safe_cast_to_u64(percentage_256)
    }

    /// Calculate sum of vector with overflow protection
    public fun safe_sum_vector(values: &vector<u64>): u64 {
        let mut sum_256: u256 = 0;
        let mut i = 0;
        let len = vector::length(values);
        
        while (i < len) {
            let value = *vector::borrow(values, i);
            sum_256 = sum_256 + (value as u256);
            i = i + 1;
        };
        
        safe_cast_to_u64(sum_256)
    }

    /// Multiply two u64 values safely using u256
    public fun safe_multiply(a: u64, b: u64): u64 {
        let result_256 = (a as u256) * (b as u256);
        safe_cast_to_u64(result_256)
    }

    /// Add two u64 values safely using u256
    public fun safe_add(a: u64, b: u64): u64 {
        let result_256 = (a as u256) + (b as u256);
        safe_cast_to_u64(result_256)
    }

    /// Calculate prize pool (bid_amount * 2) safely
    public fun calculate_prize_pool(bid_amount: u64): u64 {
        safe_multiply(bid_amount, 2)
    }

    /// Fee calculation specifically for our platform
    public fun calculate_platform_fee(
        base_amount: u64,
        fee_config: &FeeConfig
    ): (u64, u64) {
        let fee_bps = admin::get_upfront_fee_bps(fee_config);
        calculate_fee_amounts(base_amount, fee_bps)
    }

    // Test functions for validation
    #[test_only]
    public fun test_safe_cast() {
        // Should work
        assert!(safe_cast_to_u64(12345) == 12345, 0);
        
        // Should work at max
        assert!(safe_cast_to_u64(MAX_U64) == 18446744073709551615, 1);
    }

    #[test_only] 
    public fun test_percentage_calculation() {
        // 100 -> 150 should be 50% = 500000 (50.00%)
        let result = calculate_percentage_increase(100, 150);
        assert!(result == 500000, 0);
        
        // 1000 -> 1001 should be 0.1% = 1000 (0.10%)
        let result2 = calculate_percentage_increase(1000, 1001);
        assert!(result2 == 1000, 1);
    }
} 