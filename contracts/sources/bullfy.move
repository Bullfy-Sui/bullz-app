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
    const ESquadNotFound: u64 = 4001;
   // const ECannotReviveYet: u64 = 4003;
    const ERevivalNotNeeded: u64 = 4004;
    const EInvalidSquadName: u64 = 4005;

    // Error constants with proper E prefix
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
        formation: String,         // Team formation (e.g., "4-3-3", "3-5-2")
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

    // Event emitted when squad is updated.
    public struct SquadUpdated has copy, drop {
        squad_id: u64,
        updated_by: address,
        name_changed: bool,
        players_changed: bool,
        new_name: String,
        new_players: vector<String>,
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
            formation: string::utf8(b""),  // Create with empty formation - will be set when adding players
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

    // Revives a dead squad with automatic fee calculation based on wait time
    // - If less than 24 hours since death: instant revival fee (higher)
    // - If 24+ hours since death: standard revival fee (lower)
    public entry fun revive_squad(
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
        assert!(table::contains(&squad_registry.squads, squad_id), ESquadNotFound);
        let squad = table::borrow_mut(&mut squad_registry.squads, squad_id);
        assert!(squad.owner == owner, common_errors::unauthorized());
        
        // Check if squad needs revival
        assert!(squad.life == 0, ERevivalNotNeeded);
        assert!(option::is_some(&squad.death_time), ERevivalNotNeeded);
        
        let death_time = *option::borrow(&squad.death_time);
        let time_since_death = current_time - death_time;
        
        // Automatically determine fee and revival type based on wait time
        let (revival_fee, revival_type) = if (time_since_death >= REVIVAL_WAIT_TIME_MS) {
            // Standard revival: 24+ hours wait, lower fee
            (admin::get_standard_revival_fee(fee_config), string::utf8(b"standard"))
        } else {
            // Instant revival: less than 24 hours, higher fee
            (admin::get_instant_revival_fee(fee_config), string::utf8(b"instant"))
        };

        // Validate payment amount
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
            revival_type,
            fee_paid: revival_fee,
        });
    }

    // Helper function to calculate required payment for revival based on current time
    public fun calculate_revival_payment(squad: &Squad, fee_config: &FeeConfig, clock: &Clock): (u64, String) {
        if (squad.life > 0 || option::is_none(&squad.death_time)) {
            return (0, string::utf8(b"not_needed"))
        };
        
        let current_time = clock::timestamp_ms(clock);
        let death_time = *option::borrow(&squad.death_time);
        let time_since_death = current_time - death_time;
        
        if (time_since_death >= REVIVAL_WAIT_TIME_MS) {
            (admin::get_standard_revival_fee(fee_config), string::utf8(b"standard"))
        } else {
            (admin::get_instant_revival_fee(fee_config), string::utf8(b"instant"))
        }
    }

    // Helper function to get revival fee for a specific type
    public fun calculate_revival_fee(revival_type: String, fee_config: &FeeConfig): u64 {
        if (revival_type == string::utf8(b"standard")) {
            admin::get_standard_revival_fee(fee_config)
        } else if (revival_type == string::utf8(b"instant")) {
            admin::get_instant_revival_fee(fee_config)
        } else {
            0 // Invalid type
        }
    }

    // Helper function to check if standard revival is available (24hr wait met)
    public fun can_revive_standard(squad: &Squad, clock: &Clock): bool {
        if (squad.life > 0 || option::is_none(&squad.death_time)) {
            return false
        };
        
        let current_time = clock::timestamp_ms(clock);
        let death_time = *option::borrow(&squad.death_time);
        current_time >= death_time + REVIVAL_WAIT_TIME_MS
    }

    // Helper function to check if instant revival is available (squad is dead)
    public fun can_revive_instant(squad: &Squad): bool {
        squad.life == 0 && option::is_some(&squad.death_time)
    }

    // Updates squad name and/or players (only squad owner can update)
    public entry fun update_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        mut new_squad_name: Option<String>,
        mut new_player_names: Option<vector<String>>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        
        // Only squad owner can update
        assert!(squad.owner == sender, common_errors::unauthorized());
        
        let mut name_changed = false;
        let mut players_changed = false;
        
        // Update squad name if provided
        if (option::is_some(&new_squad_name)) {
            let squad_name = option::extract(&mut new_squad_name);
            // Validate squad name
            assert!(string::length(&squad_name) >= MIN_SQUAD_NAME_LENGTH, EInvalidSquadName);
            assert!(string::length(&squad_name) <= MAX_SQUAD_NAME_LENGTH, EInvalidSquadName);
            
            squad.name = squad_name;
            name_changed = true;
        };
        
        // Update players if provided
        if (option::is_some(&new_player_names)) {
            let player_names = option::extract(&mut new_player_names);
            
            // Must be exactly 7 players if updating
            assert!(vector::length(&player_names) == 7, EMustAddExactlySevenPlayers);
            
            // Replace all players
            squad.players = player_names;
            players_changed = true;
        };
        
        // At least one field must be updated
        assert!(name_changed || players_changed, common_errors::invalid_argument());
        
        event::emit(SquadUpdated {
            squad_id,
            updated_by: sender,
            name_changed,
            players_changed,
            new_name: squad.name,
            new_players: squad.players,
            total_players: vector::length(&squad.players),
        });
    }

    // Helper function to update only squad name
    public entry fun update_squad_name(
        registry: &mut SquadRegistry,
        squad_id: u64,
        new_squad_name: String,
        ctx: &mut TxContext
    ) {
        update_squad(
            registry,
            squad_id,
            option::some(new_squad_name),
            option::none(),
            ctx
        );
    }

    // Helper function to update only squad players
    public entry fun update_squad_players(
        registry: &mut SquadRegistry,
        squad_id: u64,
        new_player_names: vector<String>,
        ctx: &mut TxContext
    ) {
        update_squad(
            registry,
            squad_id,
            option::none(),
            option::some(new_player_names),
            ctx
        );
    }

    // Adds 7 players to a squad in one call and sets the squad name (only squad owner can add players).
    public entry fun add_players_to_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        squad_name: String,
        formation: String,
        player_names: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        
        // Only squad owner can add players
        assert!(squad.owner == tx_context::sender(ctx), EOwnerDoesNotHaveSquad);
        
        // Validate squad name
        assert!(string::length(&squad_name) >= MIN_SQUAD_NAME_LENGTH, EInvalidSquadName);
        assert!(string::length(&squad_name) <= MAX_SQUAD_NAME_LENGTH, EInvalidSquadName);
        
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
        
        // Set the formation
        squad.formation = formation;
        
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

    // Get squad formation
    public fun get_squad_formation(squad: &Squad): &String {
        &squad.formation
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