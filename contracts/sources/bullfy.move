
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
    const EMustAddExactlySevenPlayers: vector<u8> = b"Must add exactly 7 players";
    #[error]
    const ENotEnoughDefenders: vector<u8> = b"Not enough defenders";
    #[error]
    const ENotEnoughMidfielders: vector<u8> = b"Not enough midfielders";
    #[error]
    const ENotEnoughForwards: vector<u8> = b"Not enough forwards";

    // Fee amount in MIST (1 SUI = 10^9 MIST)
    const SQUAD_CREATION_FEE: u64 = 1_000_000_000;
    
    // Initial squad life points
    const INITIAL_SQUAD_LIFE: u64 = 5;
    
    // Revival wait time in milliseconds (24 hours)
    const REVIVAL_WAIT_TIME_MS: u64 = 86_400_000; // 24 * 60 * 60 * 1000

    // Squad formation enum
    public struct SquadFormation has copy, drop, store {
        formation_type: u8, // 0: 4-4-2, 1: 4-3-3, 2: 3-5-2, etc.
    }

    // Represents a football squad.
    public struct Squad has key, store {
        id: UID,
        owner: address,
        squad_id: u64,
        name: String,
        goalkeeper: Option<String>,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation: SquadFormation,
        players: vector<String>,
        life: u64,               // Life points (starts at 5)
        death_time: Option<u64>, // Timestamp when squad died (life reached 0)
    }

    // Represents a player in a squad.
    public struct Player has key, store {
        id: UID,
        name: String,
        squad_owner: address,
        token_price_id: String,
        allocated_value: u64,
        position: u8,
        players: vector<String>,
        life: u64,               // Life points (starts at 5)
        death_time: Option<u64>, // Timestamp when squad died (life reached 0)
    }

    // Registry for players.
    public struct PlayerRegistry has key {
        id: UID,
        players: Table<u64, Player>,
        next_player_id: u64,
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
    }

    // Event emitted when a new player is created.
    public struct PlayerCreated has copy, drop {
        player_id: u64,
        squad_owner: address,
        name: String,
    }

    // Event emitted when multiple players are added to squad.
    public struct PlayersAddedToSquad has copy, drop {
        squad_id: u64,
        players_added: vector<String>,
        total_players: u64,
    }

    // Helper function to create formation
    fun create_formation(formation_type: u8): SquadFormation {
        SquadFormation { formation_type }
    }

    // Initializes the registries.
    fun init(ctx: &mut TxContext) {
        let squad_registry = SquadRegistry {
            id: sui::object::new(ctx),
            squads: sui::table::new(ctx),
            owner_squads: sui::table::new(ctx),
            next_squad_id: 1, // Start squad IDs from 1
        };
        transfer::share_object(squad_registry);

        let player_registry = PlayerRegistry {
            id: sui::object::new(ctx),
            players: sui::table::new(ctx),
            next_player_id: 1, // Start from 1 instead of 0
        };
        transfer::share_object(player_registry);
    }

    // Creates a new squad.
    public entry fun create_squad(
        registry: &mut SquadRegistry,
        fees: &mut fee_collector::Fees,
        mut payment: Coin<SUI>,
        name: String,
        goalkeeper: String,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation_type: u8,
        ctx: &mut TxContext
    ) {
        // Verify payment amount
        let payment_amount = sui::coin::value(&payment);
        assert!(payment_amount >= SQUAD_CREATION_FEE, EInsufficientFee);

        // Validate squad composition
        assert!(vector::length(&defenders) >= 1, ENotEnoughDefenders);
        assert!(vector::length(&midfielders) >= 1, ENotEnoughMidfielders);
        assert!(vector::length(&forwards) >= 1, ENotEnoughForwards);

        let owner = sui::tx_context::sender(ctx);
        let squad_id = registry.next_squad_id;
        registry.next_squad_id = squad_id + 1;

        let squad = Squad {
            id: sui::object::new(ctx),
            owner,
            squad_id,
            name,
            goalkeeper: std::option::some(goalkeeper),
            defenders,
            midfielders,
            forwards,
            formation: create_formation(formation_type),
            players: vector::empty<String>(), // Initialize with empty vector
            life: INITIAL_SQUAD_LIFE,         // Start with 5 life points
            death_time: std::option::none<u64>(),       // Not dead initially
        };

        // Add the squad to the registry
        sui::table::add(&mut registry.squads, squad_id, squad);

        // Add the squad to the owner's list of squads
        if (!sui::table::contains(&registry.owner_squads, owner)) {
            sui::table::add(&mut registry.owner_squads, owner, vector::empty<u64>());
        };
        
        let owner_squads = sui::table::borrow_mut(&mut registry.owner_squads, owner);
        vector::push_back(owner_squads, squad_id);

        // Handle payment: take only the required fee, return the rest
        if (payment_amount == SQUAD_CREATION_FEE) {
            // Exact payment, use the whole coin
            fee_collector::collect(fees, payment, ctx);
        } else {
            // More than required, split and return change
            let fee_coin = sui::coin::split(&mut payment, SQUAD_CREATION_FEE, ctx);
            fee_collector::collect(fees, fee_coin, ctx);
            transfer::public_transfer(payment, owner);
        };

        event::emit(SquadCreated { 
            owner,
            squad_id,
            name,
            life: INITIAL_SQUAD_LIFE,
        });
    }

    // Gets a squad by ID.
    public fun get_squad(registry: &SquadRegistry, squad_id: u64): &Squad {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        sui::table::borrow(&registry.squads, squad_id)
    }

    // Gets all squads for an owner.
    public fun get_owner_squads(registry: &SquadRegistry, owner: address): &vector<u64> {
        if (!sui::table::contains(&registry.owner_squads, owner)) {
            abort EOwnerDoesNotHaveSquad
        };
        sui::table::borrow(&registry.owner_squads, owner)
    }

    // Checks if an owner has any squads.
    public fun has_squads(registry: &SquadRegistry, owner: address): bool {
        sui::table::contains(&registry.owner_squads, owner)
    }

    // Checks if a squad is still alive (has life > 0).
    public fun is_squad_alive(squad: &Squad): bool {
        squad.life > 0
    }

    // Decreases squad life by 1 (used when squad loses competition).
    public fun decrease_squad_life(registry: &mut SquadRegistry, squad_id: u64, clock: &Clock) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        assert!(squad.life > 0, ESquadHasNoLife);
        
        squad.life = squad.life - 1;
        
        // If squad dies, record the death time
        if (squad.life == 0) {
            let death_time = sui::clock::timestamp_ms(clock);
            squad.death_time = std::option::some(death_time);
            
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
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        
        squad.life = squad.life + 1;
        
        event::emit(SquadLifeGained {
            squad_id,
            life_gained: 1,
            new_life: squad.life,
        });
    }

    // Revives a dead squad after 24 hours, restoring it to 5 life points.
    public entry fun revive_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        clock: &Clock,
        name: String,
        goalkeeper: String,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation_type: u8,
        ctx: &mut TxContext
    ) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        
        // Validate squad composition
        assert!(vector::length(&defenders) >= 1, ENotEnoughDefenders);
        assert!(vector::length(&midfielders) >= 1, ENotEnoughMidfielders);
        assert!(vector::length(&forwards) >= 1, ENotEnoughForwards);

        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        let owner = sui::tx_context::sender(ctx);
        
        // Only squad owner can revive
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);
        
        // Squad must be dead (life = 0 and has death_time)
        assert!(squad.life == 0, ESquadNotDead);
        assert!(std::option::is_some(&squad.death_time), ESquadNotDead);
        
        // Check if 24 hours have passed
        let current_time = sui::clock::timestamp_ms(clock);
        let death_time = *std::option::borrow(&squad.death_time);
        assert!(current_time >= death_time + REVIVAL_WAIT_TIME_MS, ERevivalNotReady);
        
        // Revive the squad
        squad.life = INITIAL_SQUAD_LIFE;
        squad.death_time = std::option::none<u64>();
        
        // Update squad composition
        squad.goalkeeper = std::option::some(goalkeeper);
        squad.defenders = defenders;
        squad.midfielders = midfielders;
        squad.forwards = forwards;
        squad.formation = create_formation(formation_type);
        squad.name = name;
        
        event::emit(SquadRevived {
            squad_id,
            revived_at: current_time,
        });
    }

    // Creates a new player.
    public entry fun create_player(
        player_registry: &mut PlayerRegistry,
        squad_registry: &SquadRegistry,
        squad_id: u64,
        name: String,
        token_price_id: String,
        allocated_value: u64,
        position: u8,
        ctx: &mut TxContext
    ) {
        let owner = sui::tx_context::sender(ctx);
        // Verify that the squad exists and belongs to the owner
        assert!(sui::table::contains(&squad_registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow(&squad_registry.squads, squad_id);
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);

        let player_id = player_registry.next_player_id;
        player_registry.next_player_id = player_id + 1;

        let player = Player {
            id: sui::object::new(ctx),
            name,
            squad_owner: owner,
            token_price_id,
            allocated_value,
            position,
            players: vector::empty<String>(),
            life: INITIAL_SQUAD_LIFE,
            death_time: std::option::none<u64>(),
        };

        sui::table::add(&mut player_registry.players, player_id, player);

        event::emit(PlayerCreated {
            player_id,
            squad_owner: owner,
            name,
        });
    }

    // Checks if a squad can be revived (dead for 24+ hours).
    public fun can_revive_squad(squad: &Squad, clock: &Clock): bool {
        if (squad.life > 0 || std::option::is_none(&squad.death_time)) {
            return false
        };
        
        let current_time = sui::clock::timestamp_ms(clock);
        let death_time = *std::option::borrow(&squad.death_time);
        current_time >= death_time + REVIVAL_WAIT_TIME_MS
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
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        
        let squad = sui::table::borrow(&registry.squads, squad_id);
        let owner = sui::tx_context::sender(ctx);
        
        // Ensure only the squad owner can delete it
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);
        
        // Remove from the registry
        let squad = sui::table::remove(&mut registry.squads, squad_id);
        
        // Remove from owner's squads list
        let owner_squads = sui::table::borrow_mut(&mut registry.owner_squads, owner);
        let (found, index) = vector::index_of(owner_squads, &squad_id);
        if (found) {
            vector::remove(owner_squads, index);
        };
        
        // Delete the squad object
        let Squad { 
            id, 
            owner: _, 
            squad_id: _, 
            name: _, 
            goalkeeper: _, 
            defenders: _, 
            midfielders: _, 
            forwards: _, 
            formation: _, 
            players: _, 
            life: _, 
            death_time: _ 
        } = squad;
        sui::object::delete(id);
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

    // Adds 7 players to a squad in one call (only squad owner can add players).
    public entry fun add_players_to_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        player_names: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(sui::table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = sui::table::borrow_mut(&mut registry.squads, squad_id);
        
        // Only squad owner can add players
        assert!(squad.owner == sui::tx_context::sender(ctx), EOwnerDoesNotHaveSquad);
        
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
}