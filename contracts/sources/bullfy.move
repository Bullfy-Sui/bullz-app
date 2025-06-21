module bullfy::squad_manager {
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use bullfy::fee_collector;
    use bullfy::admin::{Self, FeeConfig};
    use bullfy::common_errors;
    use bullfy::payment_utils;

    // Error constants (module-specific only)
    const E_SQUAD_NOT_FOUND: u64 = 4001;
    const E_CANNOT_REVIVE_YET: u64 = 4003;
    const E_REVIVAL_NOT_NEEDED: u64 = 4004;
    const E_INVALID_SQUAD_NAME: u64 = 4005;

    // Error constants kept for backward compatibility
    const EOwnerDoesNotHaveSquad: u64 = 4008;
    const ESquadNotDead: u64 = 4009;
    const EMustAddExactlySevenPlayers: u64 = 4011;
    const EPlayerAlreadyInSquad: u64 = 4012;

    // Constants
    const MIN_SQUAD_NAME_LENGTH: u64 = 1;
    const MAX_SQUAD_NAME_LENGTH: u64 = 50;
    const INITIAL_SQUAD_LIFE: u64 = 5;
    const REVIVAL_WAIT_TIME_MS: u64 = 864_00_000; // 24 * 60 * 60 * 1000

    // Represents a football squad.
    public struct Squad has key, store {
        id: UID,
        owner: address,
        squad_id: u64,
        name: String,
        players: vector<String>,
        life: u64,               // Life points (starts at 5)
        death_time: Option<u64>, // Timestamp when squad died (life reached 0)
    }

    // Registry for all squads.
    public struct SquadRegistry has key {
        id: UID,
        squads: Table<u64, Squad>,
        owner_squads: Table<address, vector<u64>>,
        next_squad_id: u64,
    }

    // Event emitted when a new squad is created.
    public struct SquadCreated has copy, drop {
        owner: address,
        squad_id: u64,
        name: String,
        life: u64,
        fee_paid: u64,
    }

    // Event emitted when squad loses life.
    public struct SquadLifeLost has copy, drop {
        squad_id: u64,
        remaining_life: u64,
    }

    // Event emitted when squad gains life.
    public struct SquadLifeGained has copy, drop {
        squad_id: u64,
        life_gained: u64,
        new_life: u64,
    }

    // Event emitted when squad dies.
    public struct SquadDied has copy, drop {
        squad_id: u64,
        death_time: u64,
    }

    // Event emitted when squad is revived.
    public struct SquadRevived has copy, drop {
        squad_id: u64,
        revived_at: u64,
        revival_type: String, // "standard" or "instant"
        fee_paid: u64,
    }

    

    // Event emitted when multiple players are added to squad.
    public struct PlayersAddedToSquad has copy, drop {
        squad_id: u64,
        players_added: vector<String>,
        total_players: u64,
    }

    // Initializes the registries.
    fun init(ctx: &mut TxContext) {
        let squad_registry = SquadRegistry {
            id: object::new(ctx),
            squads: table::new(ctx),
            owner_squads: table::new(ctx),
            next_squad_id: 1, // Start squad IDs from 1
        };
        transfer::share_object(squad_registry);
    }

    // Creates a new squad with empty players vector and 5 life points.
    public entry fun create_squad(
        squad_registry: &mut SquadRegistry,
        fee_config: &FeeConfig,
        fees: &mut fee_collector::Fees,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        
        // Calculate and handle squad creation fee using payment utils
        let creation_fee = admin::get_squad_creation_fee(fee_config);
        payment_utils::validate_payment_amount(coin::value(&payment), creation_fee);
        
        // Handle exact payment (no change expected for creation fee)
        if (coin::value(&payment) > creation_fee) {
            let change_amount = coin::value(&payment) - creation_fee;
            let change = coin::split(&mut payment, change_amount, ctx);
            sui::transfer::public_transfer(change, owner);
        };

        // Send fee to collector
        fee_collector::collect(fees, payment, ctx);

        let squad_id = squad_registry.next_squad_id;
        squad_registry.next_squad_id = squad_id + 1;

        let squad = Squad {
            id: object::new(ctx),
            owner,
            squad_id,
            name: string::utf8(b""),  // Create with empty name - will be set when adding players
            players: vector::empty<String>(),  // Create with empty players vector
            life: INITIAL_SQUAD_LIFE,         // Start with 5 life points
            death_time: option::none(),       // Not dead initially
        };

        // Add the squad to the registry
        table::add(&mut squad_registry.squads, squad_id, squad);

        // Add the squad to the owner's list of squads
        if (!table::contains(&squad_registry.owner_squads, owner)) {
            table::add(&mut squad_registry.owner_squads, owner, vector::empty<u64>());
        };
        
        let owner_squads = table::borrow_mut(&mut squad_registry.owner_squads, owner);
        vector::push_back(owner_squads, squad_id);

        event::emit(SquadCreated { 
            owner,
            squad_id,
            name: string::utf8(b""),  // Empty name initially
            life: INITIAL_SQUAD_LIFE,
            fee_paid: creation_fee,
        });
    }

    // Helper function to calculate required payment for squad creation
    public fun calculate_squad_creation_payment(fee_config: &FeeConfig): u64 {
        admin::get_squad_creation_fee(fee_config)
    }

    // Checks if an owner has any squads.
    public fun has_squads(registry: &SquadRegistry, owner: address): bool {
        table::contains(&registry.owner_squads, owner)
    }

    // Checks if a squad is still alive (has life > 0).
    public fun is_squad_alive(squad: &Squad): bool {
        squad.life > 0
    }

    // Decreases squad life by 1 (used when squad loses competition).
    public fun decrease_squad_life(registry: &mut SquadRegistry, squad_id: u64, clock: &Clock) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        assert!(squad.life > 0, ESquadNotDead);
        
        squad.life = squad.life - 1;
        
        // If squad dies, record the death time
        if (squad.life == 0) {
            let death_time = clock::timestamp_ms(clock);
            squad.death_time = option::some(death_time);
            
            event::emit(SquadDied {
                squad_id,
                death_time,
            });
        };
        
        event::emit(SquadLifeLost {
            squad_id,
            remaining_life: squad.life,
        });
    }

    // Increases squad life by 1 (used when squad wins competition).
    public fun increase_squad_life(registry: &mut SquadRegistry, squad_id: u64) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        
        // Only increase if life is below the cap (5)
        if (squad.life < INITIAL_SQUAD_LIFE) {
            squad.life = squad.life + 1;
            
            event::emit(SquadLifeGained {
                squad_id,
                life_gained: 1,
                new_life: squad.life,
            });
        };
    }

    // Revives a dead squad after 24 hours with standard fee (0.05 SUI)
    public entry fun revive_squad_standard(
        squad_registry: &mut SquadRegistry,
        fee_config: &FeeConfig,
        fees: &mut fee_collector::Fees,
        squad_id: u64,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate squad exists and is owned by sender
        assert!(table::contains(&squad_registry.squads, squad_id), E_SQUAD_NOT_FOUND);
        let squad = table::borrow_mut(&mut squad_registry.squads, squad_id);
        assert!(squad.owner == owner, common_errors::unauthorized());
        
        // Check if squad needs revival
        assert!(squad.life == 0, E_REVIVAL_NOT_NEEDED);
        assert!(option::is_some(&squad.death_time), E_REVIVAL_NOT_NEEDED);
        
        // Check 24-hour waiting period
        let death_time = *option::borrow(&squad.death_time);
        assert!(current_time >= death_time + REVIVAL_WAIT_TIME_MS, E_CANNOT_REVIVE_YET);

        // Calculate and handle standard revival fee using payment utils
        let revival_fee = admin::get_standard_revival_fee(fee_config);
        payment_utils::validate_payment_amount(coin::value(&payment), revival_fee);
        
        // Handle payment with change return
        if (coin::value(&payment) > revival_fee) {
            let change_amount = coin::value(&payment) - revival_fee;
            let change = coin::split(&mut payment, change_amount, ctx);
            sui::transfer::public_transfer(change, owner);
        };

        // Send fee to collector
        fee_collector::collect(fees, payment, ctx);

        // Revive the squad
        squad.life = INITIAL_SQUAD_LIFE;
        squad.death_time = option::none();
        
        event::emit(SquadRevived {
            squad_id,
            revived_at: current_time,
            revival_type: string::utf8(b"standard"),
            fee_paid: revival_fee,
        });
    }

    // Revives a dead squad instantly with higher fee (0.1 SUI)
    public entry fun revive_squad_instant(
        squad_registry: &mut SquadRegistry,
        fee_config: &FeeConfig,
        fees: &mut fee_collector::Fees,
        squad_id: u64,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        // Validate squad exists and is owned by sender
        assert!(table::contains(&squad_registry.squads, squad_id), E_SQUAD_NOT_FOUND);
        let squad = table::borrow_mut(&mut squad_registry.squads, squad_id);
        assert!(squad.owner == owner, common_errors::unauthorized());
        
        // Check if squad needs revival
        assert!(squad.life == 0, E_REVIVAL_NOT_NEEDED);
        assert!(option::is_some(&squad.death_time), E_REVIVAL_NOT_NEEDED);

        // Calculate and handle instant revival fee using payment utils
        let revival_fee = admin::get_instant_revival_fee(fee_config);
        payment_utils::validate_payment_amount(coin::value(&payment), revival_fee);
        
        // Handle payment with change return
        if (coin::value(&payment) > revival_fee) {
            let change_amount = coin::value(&payment) - revival_fee;
            let change = coin::split(&mut payment, change_amount, ctx);
            sui::transfer::public_transfer(change, owner);
        };

        // Send fee to collector
        fee_collector::collect(fees, payment, ctx);

        // Revive the squad
        squad.life = INITIAL_SQUAD_LIFE;
        squad.death_time = option::none();
        
        event::emit(SquadRevived {
            squad_id,
            revived_at: clock::timestamp_ms(clock),
            revival_type: string::utf8(b"instant"),
            fee_paid: revival_fee,
        });
    }

    // Helper functions to calculate required payments for revival
    public fun calculate_standard_revival_payment(fee_config: &FeeConfig): u64 {
        admin::get_standard_revival_fee(fee_config)
    }

    public fun calculate_instant_revival_payment(fee_config: &FeeConfig): u64 {
        admin::get_instant_revival_fee(fee_config)
    }

    // Checks if a squad can be revived with standard option (dead for 24+ hours).
    public fun can_revive_squad_standard(squad: &Squad, clock: &Clock): bool {
        if (squad.life > 0 || option::is_none(&squad.death_time)) {
            return false
        };
        
        let current_time = clock::timestamp_ms(clock);
        let death_time = *option::borrow(&squad.death_time);
        current_time >= death_time + REVIVAL_WAIT_TIME_MS
    }

    // Checks if a squad can be revived with instant option (any dead squad).
    public fun can_revive_squad_instant(squad: &Squad): bool {
        squad.life == 0 && option::is_some(&squad.death_time)
    }

    // Gets squad death time (if dead).
    public fun get_squad_death_time(squad: &Squad): Option<u64> {
        squad.death_time
    }

    // Deletes a squad.
    public entry fun delete_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        
        let squad = table::borrow(&registry.squads, squad_id);
        let owner = tx_context::sender(ctx);
        
        // Ensure only the squad owner can delete it
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);
        
        // Remove from the registry
        let squad = table::remove(&mut registry.squads, squad_id);
        
        // Remove from owner's squads list
        let owner_squads = table::borrow_mut(&mut registry.owner_squads, owner);
        let (found, index) = vector::index_of(owner_squads, &squad_id);
        if (found) {
            vector::remove(owner_squads, index);
        };
        
        // Delete the squad object
        let Squad { id, owner: _, squad_id: _, name: _, players: _, life: _, death_time: _ } = squad;
        object::delete(id);
    }

   


    // Adds 7 players to a squad in one call and sets the squad name (only squad owner can add players).
    public entry fun add_players_to_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        squad_name: String,
        player_names: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        
        // Only squad owner can add players
        assert!(squad.owner == tx_context::sender(ctx), EOwnerDoesNotHaveSquad);
        
        // Validate squad name
        assert!(string::length(&squad_name) >= MIN_SQUAD_NAME_LENGTH, E_INVALID_SQUAD_NAME);
        assert!(string::length(&squad_name) <= MAX_SQUAD_NAME_LENGTH, E_INVALID_SQUAD_NAME);
        
        // Must be exactly 7 players
        assert!(vector::length(&player_names) == 7, EMustAddExactlySevenPlayers);
        
        // Check for duplicates within the new players list
        let mut i = 0;
        while (i < vector::length(&player_names)) {
            let current_player = vector::borrow(&player_names, i);
            
            // Check if this player is already in the squad
            let (found_in_squad, _) = vector::index_of(&squad.players, current_player);
            assert!(!found_in_squad, EPlayerAlreadyInSquad);
            
            // Check for duplicates within the new list
            let mut j = i + 1;
            while (j < vector::length(&player_names)) {
                let other_player = vector::borrow(&player_names, j);
                assert!(current_player != other_player, EPlayerAlreadyInSquad);
                j = j + 1;
            };
            
            i = i + 1;
        };
        
        // Set the squad name
        squad.name = squad_name;
        
        // Add all players to the squad
        let mut k = 0;
        while (k < vector::length(&player_names)) {
            let player_name = *vector::borrow(&player_names, k);
            vector::push_back(&mut squad.players, player_name);
            k = k + 1;
        };
        
        event::emit(PlayersAddedToSquad {
            squad_id,
            players_added: player_names,
            total_players: vector::length(&squad.players),
        });
    }


     // Get squad name
    public fun get_squad_name(squad: &Squad): &String {
        &squad.name
    }

    // Get squad players
    public fun get_squad_players(squad: &Squad): &vector<String> {
        &squad.players
    }

    // Get squad owner
    public fun get_squad_owner(squad: &Squad): address {
        squad.owner
    }

    // Get squad ID
    public fun get_squad_id(squad: &Squad): u64 {
        squad.squad_id
    }

    // Get squad life points
    public fun get_squad_life(squad: &Squad): u64 {
        squad.life
    }

     // Gets a squad by ID.
    public fun get_squad(registry: &SquadRegistry, squad_id: u64): &Squad {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        table::borrow(&registry.squads, squad_id)
    }

    // Gets all squads for an owner.
    public fun get_owner_squads(registry: &SquadRegistry, owner: address): &vector<u64> {
        if (!table::contains(&registry.owner_squads, owner)) {
            abort EOwnerDoesNotHaveSquad
        };
        table::borrow(&registry.owner_squads, owner)
    }
} 