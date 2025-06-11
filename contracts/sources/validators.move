module bullfy::validators {
    use bullfy::squad_manager::{Self, SquadRegistry};
    use bullfy::common_errors;

    // Validate squad ownership and that squad is alive
    public fun validate_squad_ownership_and_life(
        squad_registry: &SquadRegistry,
        squad_id: u64,
        owner: address
    ) {
        let squad = squad_manager::get_squad(squad_registry, squad_id);
        assert!(squad_manager::get_squad_owner(squad) == owner, common_errors::squad_not_owned());
        assert!(squad_manager::is_squad_alive(squad), common_errors::squad_not_alive());
    }

    // Check if squad ownership and life are valid (returns bool instead of asserting)
    public fun is_squad_valid_for_owner(
        squad_registry: &SquadRegistry,
        squad_id: u64,
        owner: address
    ): bool {
        let squad = squad_manager::get_squad(squad_registry, squad_id);
        squad_manager::get_squad_owner(squad) == owner && squad_manager::is_squad_alive(squad)
    }

    // Validate bid amount against minimum
    public fun validate_bid_amount(bid_amount: u64, min_amount: u64) {
        assert!(bid_amount >= min_amount, common_errors::invalid_bid_amount());
    }

    // Check if bid amount is valid (returns bool)
    public fun is_bid_amount_valid(bid_amount: u64, min_amount: u64): bool {
        bid_amount >= min_amount
    }

    // Validate duration within range
    public fun validate_duration(duration: u64, min_duration: u64, max_duration: u64) {
        assert!(duration >= min_duration && duration <= max_duration, common_errors::invalid_duration());
    }

    // Check if duration is valid (returns bool)
    public fun is_duration_valid(duration: u64, min_duration: u64, max_duration: u64): bool {
        duration >= min_duration && duration <= max_duration
    }
} 