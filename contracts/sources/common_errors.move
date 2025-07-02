module bullfy::common_errors {
    // Authorization errors
    const EUnauthorized: u64 = 1001;
    
    // Squad-related errors
    const ESquadNotOwned: u64 = 1002;
    const ESquadNotAlive: u64 = 1003;
    const ESquadAlreadyActive: u64 = 1004;
    
    // Bid and payment errors
    const EInvalidBidAmount: u64 = 1005;
    const EInsufficientPayment: u64 = 1006;
    
    // Duration and timing errors
    const EInvalidDuration: u64 = 1007;
    
    // General input validation errors
    const EInvalidArgument: u64 = 1008;

    // Public getter functions for error codes
    public fun unauthorized(): u64 { EUnauthorized }
    public fun squad_not_owned(): u64 { ESquadNotOwned }
    public fun squad_not_alive(): u64 { ESquadNotAlive }
    public fun squad_already_active(): u64 { ESquadAlreadyActive }
    public fun invalid_bid_amount(): u64 { EInvalidBidAmount }
    public fun insufficient_payment(): u64 { EInsufficientPayment }
    public fun invalid_duration(): u64 { EInvalidDuration }
    public fun invalid_argument(): u64 { EInvalidArgument }
} 