module bullfy::common_errors {
    // Authorization errors
    const E_UNAUTHORIZED: u64 = 1001;
    
    // Squad-related errors
    const E_SQUAD_NOT_OWNED: u64 = 1002;
    const E_SQUAD_NOT_ALIVE: u64 = 1003;
    const E_SQUAD_ALREADY_ACTIVE: u64 = 1004;
    
    // Bid and payment errors
    const E_INVALID_BID_AMOUNT: u64 = 1005;
    const E_INSUFFICIENT_PAYMENT: u64 = 1006;
    
    // Duration and timing errors
    const E_INVALID_DURATION: u64 = 1007;
    
    // General input validation errors
    const E_INVALID_ARGUMENT: u64 = 1008;

    // Public getter functions for error codes
    public fun unauthorized(): u64 { E_UNAUTHORIZED }
    public fun squad_not_owned(): u64 { E_SQUAD_NOT_OWNED }
    public fun squad_not_alive(): u64 { E_SQUAD_NOT_ALIVE }
    public fun squad_already_active(): u64 { E_SQUAD_ALREADY_ACTIVE }
    public fun invalid_bid_amount(): u64 { E_INVALID_BID_AMOUNT }
    public fun insufficient_payment(): u64 { E_INSUFFICIENT_PAYMENT }
    public fun invalid_duration(): u64 { E_INVALID_DURATION }
    public fun invalid_argument(): u64 { E_INVALID_ARGUMENT }
} 