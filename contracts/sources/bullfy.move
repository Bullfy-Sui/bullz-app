
module bullfy::squad_manager {
    use sui::coin::Coin;
    use std::string::String;
    use sui::table::Table;
    use sui::event;
    use sui::sui::SUI;
    use sui::clock::Clock;
    use bullfy::fee_collector;

    // Error messages using Move 2024 #[error] attribute
    #[error]
    const EInsufficientFee: vector<u8> = b"Insufficient fee provided";
    #[error]
    const EOwnerDoesNotHaveSquad: vector<u8> = b"Owner does not have a squad";
    #[error]
    const ESquadHasNoLife: vector<u8> = b"Squad has no life remaining";
    #[error]
    const ESquadNotDead: vector<u8> = b"Squad is not dead, cannot revive";
    #[error]
    const ERevivalNotReady: vector<u8> = b"Squad cannot be revived yet, wait 24 hours";
    #[error]
    const EPlayerAlreadyInSquad: vector<u8> = b"Player is already in this squad";
    #[error]
    const EInvalidSquadSize: vector<u8> = b"Squad must have between 7 and 15 players";
    #[error]
    const ESquadNameTooLong: vector<u8> = b"Squad name exceeds maximum length";
    #[error]
    const EPlayerNameTooLong: vector<u8> = b"Player name exceeds maximum length";
    #[error]
    const EInvalidFormation: vector<u8> = b"Invalid formation type";

    // Constants
    const SQUAD_CREATION_FEE: u64 = 1_000_000_000; // 1 SUI
    const INITIAL_SQUAD_LIFE: u64 = 5;
    const REVIVAL_WAIT_TIME_MS: u64 = 86_400_000; // 24 hours
    const MAX_SQUAD_SIZE: u64 = 15;
    const MIN_SQUAD_SIZE: u64 = 7;
    const MAX_SQUAD_NAME_LENGTH: u64 = 50;
    const MAX_PLAYER_NAME_LENGTH: u64 = 30;

    // Formation types
    const FORMATION_4_4_2: u8 = 0;
    const FORMATION_4_3_3: u8 = 1;
    const FORMATION_3_5_2: u8 = 2;
    const FORMATION_5_3_2: u8 = 3;
    const FORMATION_4_5_1: u8 = 4;

    // Simplified squad formation
    public struct SquadFormation has copy, drop, store {
        formation_type: u8,
        name: String,
    }

    // Streamlined Squad struct
    public struct Squad has key, store {
        id: UID,
        owner: address,
        squad_id: u64,
        name: String,
        players: vector<String>,
        formation: SquadFormation,
        life: u64,
        death_time: Option<u64>,
        created_at: u64,
        last_updated: u64,
    }

    // Enhanced Player struct
    public struct Player has key, store {
        id: UID,
        name: String,
        squad_owner: address,
        squad_id: u64,
        token_price_id: String,
        allocated_value: u64,
        performance_score: u64, // New field for player performance
        created_at: u64,
    }

    // Enhanced registries with better organization
    public struct SquadRegistry has key {
        id: UID,
        squads: Table<u64, Squad>,
        owner_squads: Table<address, vector<u64>>,
        next_squad_id: u64,
        total_squads: u64,
        active_squads: u64,
    }

    public struct PlayerRegistry has key {
        id: UID,
        players: Table<u64, Player>,
        squad_players: Table<u64, vector<u64>>, // squad_id -> player_ids
        next_player_id: u64,
        total_players: u64,
    }

    // Events
    public struct SquadCreated has copy, drop {
        owner: address,
        squad_id: u64,
        name: String,
        formation: String,
        player_count: u64,
        created_at: u64,
    }

    public struct SquadUpdated has copy, drop {
        squad_id: u64,
        name: String,
        formation: String,
        player_count: u64,
        updated_at: u64,
    }

    public struct SquadLifeChanged has copy, drop {
        squad_id: u64,
        old_life: u64,
        new_life: u64,
        change_type: String, // "gained" or "lost"
    }

    public struct SquadDied has copy, drop {
        squad_id: u64,
        death_time: u64,
        final_score: u64,
    }

    public struct SquadRevived has copy, drop {
        squad_id: u64,
        revived_at: u64,
        new_formation: String,
    }

    public struct PlayerCreated has copy, drop {
        player_id: u64,
        squad_id: u64,
        name: String,
        squad_owner: address,
        created_at: u64,
    }

    // Formation helper functions
    fun get_formation_name(formation_type: u8): String {
        if (formation_type == FORMATION_4_4_2) {
            std::string::utf8(b"4-4-2")
        } else if (formation_type == FORMATION_4_3_3) {
            std::string::utf8(b"4-3-3")
        } else if (formation_type == FORMATION_3_5_2) {
            std::string::utf8(b"3-5-2")
        } else if (formation_type == FORMATION_5_3_2) {
            std::string::utf8(b"5-3-2")
        } else if (formation_type == FORMATION_4_5_1) {
            std::string::utf8(b"4-5-1")
        } else {
            std::string::utf8(b"Custom")
        }
    }

    fun create_formation(formation_type: u8): SquadFormation {
        assert!(formation_type <= 4, EInvalidFormation);
        SquadFormation { 
            formation_type,
            name: get_formation_name(formation_type),
        }
    }

    // Validation functions
    fun validate_squad_name(name: &String) {
        assert!(std::string::length(name) <= MAX_SQUAD_NAME_LENGTH, ESquadNameTooLong);
    }

    fun validate_player_name(name: &String) {
        assert!(std::string::length(name) <= MAX_PLAYER_NAME_LENGTH, EPlayerNameTooLong);
    }

    fun validate_squad_size(size: u64) {
        assert!(size >= MIN_SQUAD_SIZE && size <= MAX_SQUAD_SIZE, EInvalidSquadSize);
    }

    // Initialize registries
    fun init(ctx: &mut TxContext) {
        let squad_registry = SquadRegistry {
            id: sui::object::new(ctx),
            squads: sui::table::new(ctx),
            owner_squads: sui::table::new(ctx),
            next_squad_id: 1,
            total_squads: 0,
            active_squads: 0,
        };
        transfer::share_object(squad_registry);

        let player_registry = PlayerRegistry {
            id: sui::object::new(ctx),
            players: sui::table::new(ctx),
            squad_players: sui::table::new(ctx),
            next_player_id: 1,
            total_players: 0,
        };
        transfer::share_object(player_registry);
    }

    // Create a new squad with simplified parameters
    public entry fun create_squad(
        registry: &mut SquadRegistry,
        fees: &mut fee_collector::Fees,
        mut payment: Coin<SUI>,
        name: String,
        players: vector<String>,
        formation_type: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        validate_squad_name(&name);
        validate_squad_size(vector::length(&players));
        
        // Verify payment
        let payment_amount = sui::coin::value(&payment);
        assert!(payment_amount >= SQUAD_CREATION_FEE, EInsufficientFee);

        // Validate all player names and check for duplicates
        let mut i = 0;
        while (i < vector::length(&players)) {
            let player_name = vector::borrow(&players, i);
            validate_player_name(player_name);
            
            // Check for duplicates
            let mut j = i + 1;
            while (j < vector::length(&players)) {
                assert!(player_name != vector::borrow(&players, j), EPlayerAlreadyInSquad);
                j = j + 1;
            };
            i = i + 1;
        };

        let owner = sui::tx_context::sender(ctx);
        let squad_id = registry.next_squad_id;
        let current_time = sui::clock::timestamp_ms(clock);
        
        registry.next_squad_id = squad_id + 1;
        registry.total_squads = registry.total_squads + 1;
        registry.active_squads = registry.active_squads + 1;

        let squad = Squad {
            id: sui::object::new(ctx),
            owner,
            squad_id,
            name,
            players,
            formation: create_formation(formation_type),
            life: INITIAL_SQUAD_LIFE,
            death_time: std::option::none<u64>(),
            created_at: current_time,
            last_updated: current_time,
        };

        // Add to registry
        sui::table::add(&mut registry.squads, squad_id, squad);

        // Update owner's squads
        if (!sui::table::contains(&registry.owner_squads, owner)) {
            sui::table::add(&mut registry.owner_squads, owner, vector::empty<u64>());
        };
        
        let owner_squads = sui::table::borrow_mut(&mut registry.owner_squads, owner);
        vector::push_back(owner_squads, squad_id);

        // Handle payment
        if (payment_amount == SQUAD_CREATION_FEE) {
            fee_collector::collect(fees, payment, ctx);
        } else {
            let fee_coin = sui::coin::split(&mut payment, SQUAD_CREATION_FEE, ctx);
            fee_collector::collect(fees, fee_coin, ctx);
            transfer::public_transfer(payment, owner);
        };

        let squad_ref = sui::table::borrow(&registry.squads, squad_id);
        event::emit(SquadCreated { 
            owner,
            squad_id,
            name,
            formation: squad_ref.formation.name,
            player_count: vector::length(&squad_ref.players),
            created_at: current_time,
        });
    }

    // Update squad (change name, formation, or players)
    public entry fun update_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        name: String,
        players: vector<String>,
        formation_type: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        
        // Verify ownership
        assert!(squad.owner == sui::tx_context::sender(ctx), EOwnerDoesNotHaveSquad);
        
        // Validate inputs
        validate_squad_name(&name);
        validate_squad_size(vector::length(&players));
        
        // Validate player names and check for duplicates
        let mut i = 0;
        while (i < vector::length(&players)) {
            let player_name = vector::borrow(&players, i);
            validate_player_name(player_name);
            
            let mut j = i + 1;
            while (j < vector::length(&players)) {
                assert!(player_name != vector::borrow(&players, j), EPlayerAlreadyInSquad);
                j = j + 1;
            };
            i = i + 1;
        };

        // Update squad
        squad.name = name;
        squad.players = players;
        squad.formation = create_formation(formation_type);
        squad.last_updated = sui::clock::timestamp_ms(clock);

        event::emit(SquadUpdated {
            squad_id,
            name,
            formation: squad.formation.name,
            player_count: vector::length(&squad.players),
            updated_at: squad.last_updated,
        });
    }

    // Enhanced life management
    public fun decrease_squad_life(registry: &mut SquadRegistry, squad_id: u64, clock: &Clock) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        assert!(squad.life > 0, ESquadHasNoLife);
        
        let old_life = squad.life;
        squad.life = squad.life - 1;
        
        if (squad.life == 0) {
            let death_time = sui::clock::timestamp_ms(clock);
            squad.death_time = std::option::some(death_time);
            registry.active_squads = registry.active_squads - 1;
            
            event::emit(SquadDied {
                squad_id,
                death_time,
                final_score: old_life,
            });
        };
        
        event::emit(SquadLifeChanged {
            squad_id,
            old_life,
            new_life: squad.life,
            change_type: std::string::utf8(b"lost"),
        });
    }

    public fun increase_squad_life(registry: &mut SquadRegistry, squad_id: u64) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        
        let old_life = squad.life;
        squad.life = squad.life + 1;
        
        event::emit(SquadLifeChanged {
            squad_id,
            old_life,
            new_life: squad.life,
            change_type: std::string::utf8(b"gained"),
        });
    }

    // Enhanced revive function
    public entry fun revive_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        clock: &Clock,
        name: String,
        players: vector<String>,
        formation_type: u8,
        ctx: &mut TxContext
    ) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        
        validate_squad_name(&name);
        validate_squad_size(vector::length(&players));

        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        let owner = sui::tx_context::sender(ctx);
        
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);
        assert!(squad.life == 0, ESquadNotDead);
        assert!(std::option::is_some(&squad.death_time), ESquadNotDead);
        
        let current_time = sui::clock::timestamp_ms(clock);
        let death_time = *std::option::borrow(&squad.death_time);
        assert!(current_time >= death_time + REVIVAL_WAIT_TIME_MS, ERevivalNotReady);
        
        // Revive squad
        squad.life = INITIAL_SQUAD_LIFE;
        squad.death_time = std::option::none<u64>();
        squad.name = name;
        squad.players = players;
        squad.formation = create_formation(formation_type);
        squad.last_updated = current_time;
        
        registry.active_squads = registry.active_squads + 1;
        
        event::emit(SquadRevived {
            squad_id,
            revived_at: current_time,
            new_formation: squad.formation.name,
        });
    }

    // Enhanced player creation
    public entry fun create_player(
        player_registry: &mut PlayerRegistry,
        squad_registry: &SquadRegistry,
        squad_id: u64,
        name: String,
        token_price_id: String,
        allocated_value: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let owner = sui::tx_context::sender(ctx);
        
        // Verify squad ownership
        assert!(sui::table::contains(&squad_registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow(&squad_registry.squads, squad_id);
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);
        
        validate_player_name(&name);

        let player_id = player_registry.next_player_id;
        let current_time = sui::clock::timestamp_ms(clock);
        
        player_registry.next_player_id = player_id + 1;
        player_registry.total_players = player_registry.total_players + 1;

        let player = Player {
            id: sui::object::new(ctx),
            name,
            squad_owner: owner,
            squad_id,
            token_price_id,
            allocated_value,
            performance_score: 0,
            created_at: current_time,
        };

        sui::table::add(&mut player_registry.players, player_id, player);
        
        // Update squad players mapping
        if (!sui::table::contains(&player_registry.squad_players, squad_id)) {
            sui::table::add(&mut player_registry.squad_players, squad_id, vector::empty<u64>());
        };
        let squad_players = sui::table::borrow_mut(&mut player_registry.squad_players, squad_id);
        vector::push_back(squad_players, player_id);

        event::emit(PlayerCreated {
            player_id,
            squad_id,
            name,
            squad_owner: owner,
            created_at: current_time,
        });
    }

    // Getter functions
    public fun get_squad(registry: &SquadRegistry, squad_id: u64): &Squad {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        sui::table::borrow(&registry.squads, squad_id)
    }

    public fun get_owner_squads(registry: &SquadRegistry, owner: address): &vector<u64> {
        if (!sui::table::contains(&registry.owner_squads, owner)) {
            abort EOwnerDoesNotHaveSquad
        };
        sui::table::borrow(&registry.owner_squads, owner)
    }

    public fun get_player(registry: &PlayerRegistry, player_id: u64): &Player {
        sui::table::borrow(&registry.players, player_id)
    }

    public fun get_player_ids_by_squad(registry: &PlayerRegistry, squad_id: u64): &vector<u64> {
        sui::table::borrow(&registry.squad_players, squad_id)
    }

    // Utility functions
    public fun has_squads(registry: &SquadRegistry, owner: address): bool {
        sui::table::contains(&registry.owner_squads, owner)
    }

    public fun is_squad_alive(squad: &Squad): bool {
        squad.life > 0
    }

    public fun can_revive_squad(squad: &Squad, clock: &Clock): bool {
        if (squad.life > 0 || std::option::is_none(&squad.death_time)) {
            return false
        };
        
        let current_time = sui::clock::timestamp_ms(clock);
        let death_time = *std::option::borrow(&squad.death_time);
        current_time >= death_time + REVIVAL_WAIT_TIME_MS
    }

    public fun get_registry_stats(registry: &SquadRegistry): (u64, u64) {
        (registry.total_squads, registry.active_squads)
    }

    // Squad property getters
    public fun get_squad_name(squad: &Squad): &String { &squad.name }
    public fun get_squad_player_names(squad: &Squad): &vector<String> { &squad.players }
    public fun get_squad_owner(squad: &Squad): address { squad.owner }
    public fun get_squad_id(squad: &Squad): u64 { squad.squad_id }
    public fun get_squad_life(squad: &Squad): u64 { squad.life }
    public fun get_squad_formation(squad: &Squad): &SquadFormation { &squad.formation }
    public fun get_squad_death_time(squad: &Squad): Option<u64> { squad.death_time }
    public fun get_squad_created_at(squad: &Squad): u64 { squad.created_at }
    public fun get_squad_last_updated(squad: &Squad): u64 { squad.last_updated }

    // Enhanced delete function
    public entry fun delete_squad(
        registry: &mut SquadRegistry,
        player_registry: &mut PlayerRegistry,
        squad_id: u64,
        ctx: &mut TxContext
    ) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        
        let squad = sui::table::borrow(&registry.squads, squad_id);
        let owner = sui::tx_context::sender(ctx);
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);
        
        let is_alive = squad.life > 0;
        
        // Remove squad
        let squad = sui::table::remove(&mut registry.squads, squad_id);
        
        // Update counters
        registry.total_squads = registry.total_squads - 1;
        if (is_alive) {
            registry.active_squads = registry.active_squads - 1;
        };
        
        // Remove from owner's list
        let owner_squads = sui::table::borrow_mut(&mut registry.owner_squads, owner);
        let (found, index) = vector::index_of(owner_squads, &squad_id);
        if (found) {
            vector::remove(owner_squads, index);
        };
        
        // Clean up squad players mapping
        if (sui::table::contains(&player_registry.squad_players, squad_id)) {
            sui::table::remove(&mut player_registry.squad_players, squad_id);
        };
        
        // Destroy squad
        let Squad { 
            id, owner: _, squad_id: _, name: _, players: _, formation: _, 
            life: _, death_time: _, created_at: _, last_updated: _ 
        } = squad;
        sui::object::delete(id);
    }
}