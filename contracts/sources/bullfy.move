 #[allow(duplicate_alias,unused_use,unused_const)]
 module bullfy::squad_manager {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use std::option::{Self, Option};
    use std::vector;
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::event;
    use sui::sui::SUI;

    // Error messages using Move 2024 #[error] attribute
    #[error]
    const ENotEnoughDefenders: vector<u8> = b"At least one defender is required";
    #[error]
    const ENotEnoughMidfielders: vector<u8> = b"At least one midfielder is required";
    #[error]
    const ENotEnoughForwards: vector<u8> = b"At least one forward is required";
    #[error]
    const EInsufficientFee: vector<u8> = b"Insufficient fee provided";
    #[error]
    const EOwnerAlreadyHasSquad: vector<u8> = b"Owner already has a squad";
    #[error]
    const EOwnerDoesNotHaveSquad: vector<u8> = b"Owner does not have a squad";
    #[error]
    const EPlayerDoesNotExist: vector<u8> = b"Player does not exist";

    // Struct for squad formation (changed from enum to struct with constants)
    public struct SquadFormation has copy, drop, store {
        formation_type: u8,
    }

    // Formation constants
    const FORMATION_4_3_2_1: u8 = 0;
    const FORMATION_4_2_3_1: u8 = 1;
    const FORMATION_4_2_2_2: u8 = 2;
    const FORMATION_4_3_1_2: u8 = 3;
    const FORMATION_4_2_1_3: u8 = 4;

    /// Represents a football squad.
    public struct Squad has key, store {
        id: UID,
        owner: address,
        goalkeeper: Option<String>,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation: SquadFormation,
    }

    /// Represents a player in a squad.
    public struct Player has key, store {
        id: UID,
        name: String,
        squad_owner: address, // Changed from squad_id to squad_owner for easier lookup
        token_price_id: String,
        allocated_value: u64,
        position: u8,
    }

    /// Registry for all squads.
    public struct SquadRegistry has key {
        id: UID,
        squads: Table<address, Squad>,
    }

    /// Registry for all players.
    public struct PlayerRegistry has key {
        id: UID,
        players: Table<u64, Player>,
        next_player_id: u64,
    }

    /// Event emitted when a new squad is created.
    public struct SquadCreated has copy, drop {
        owner: address,
        squad_id: address, // Using address as squad identifier
    }

    /// Event emitted when a new player is created.
    public struct PlayerCreated has copy, drop {
        player_id: u64,
        squad_owner: address,
        name: String,
    }

    /// Helper functions for formations
    public fun create_formation(formation_type: u8): SquadFormation {
        SquadFormation { formation_type }
    }

    public fun get_formation_type(formation: &SquadFormation): u8 {
        formation.formation_type
    }

    /// Initializes the registries.
    fun init(ctx: &mut TxContext) {
        let squad_registry = SquadRegistry {
            id: object::new(ctx),
            squads: table::new(ctx),
        };
        transfer::share_object(squad_registry);

        let player_registry = PlayerRegistry {
            id: object::new(ctx),
            players: table::new(ctx),
            next_player_id: 1, // Start from 1 instead of 0
        };
        transfer::share_object(player_registry);
    }

    /// Creates a new squad.
    public entry fun create_squad(
        registry: &mut SquadRegistry,
        goalkeeper: String,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation_type: u8,
        ctx: &mut TxContext
    ) {
        assert!(vector::length(&defenders) >= 1, ENotEnoughDefenders);
        assert!(vector::length(&midfielders) >= 1, ENotEnoughMidfielders);
        assert!(vector::length(&forwards) >= 1, ENotEnoughForwards);

        let owner = tx_context::sender(ctx);
        assert!(!table::contains(&registry.squads, owner), EOwnerAlreadyHasSquad);

        let formation = create_formation(formation_type);
        let squad = Squad {
            id: object::new(ctx),
            owner,
            goalkeeper: option::some(goalkeeper),
            defenders,
            midfielders,
            forwards,
            formation,
        };

        table::add(&mut registry.squads, owner, squad);

        event::emit(SquadCreated { 
            owner,
            squad_id: owner,
        });
    }

    /// Gets a squad by owner.
    public fun get_squad(registry: &SquadRegistry, owner: address): &Squad {
        assert!(table::contains(&registry.squads, owner), EOwnerDoesNotHaveSquad);
        table::borrow(&registry.squads, owner)
    }

    /// Checks if an owner has a squad.
    public fun has_squad(registry: &SquadRegistry, owner: address): bool {
        table::contains(&registry.squads, owner)
    }

    /// Updates a squad.
    public entry fun update_squad(
        registry: &mut SquadRegistry,
        goalkeeper: String,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation_type: u8,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        assert!(table::contains(&registry.squads, owner), EOwnerDoesNotHaveSquad);

        assert!(vector::length(&defenders) >= 1, ENotEnoughDefenders);
        assert!(vector::length(&midfielders) >= 1, ENotEnoughMidfielders);
        assert!(vector::length(&forwards) >= 1, ENotEnoughForwards);

        let squad = table::borrow_mut(&mut registry.squads, owner);

        squad.goalkeeper = option::some(goalkeeper);
        squad.defenders = defenders;
        squad.midfielders = midfielders;
        squad.forwards = forwards;
        squad.formation = create_formation(formation_type);
    }

    /// Creates a new player.
    public entry fun create_player(
        player_registry: &mut PlayerRegistry,
        squad_registry: &SquadRegistry,
        name: String,
        token_price_id: String,
        allocated_value: u64,
        position: u8,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        // Verify that the owner has a squad
        assert!(table::contains(&squad_registry.squads, owner), EOwnerDoesNotHaveSquad);

        let player_id = player_registry.next_player_id;
        player_registry.next_player_id = player_id + 1;

        let player = Player {
            id: object::new(ctx),
            name: name,
            squad_owner: owner,
            token_price_id,
            allocated_value,
            position,
        };

        table::add(&mut player_registry.players, player_id, player);

        event::emit(PlayerCreated {
            player_id,
            squad_owner: owner,
            name: name,
        });
    }

    /// Gets a player by ID.
    public fun get_player(player_registry: &PlayerRegistry, player_id: u64): &Player {
        assert!(table::contains(&player_registry.players, player_id), EPlayerDoesNotExist);
        table::borrow(&player_registry.players, player_id)
    }

    /// Checks if a player exists.
    public fun has_player(player_registry: &PlayerRegistry, player_id: u64): bool {
        table::contains(&player_registry.players, player_id)
    }

    /// Updates a player.
    public entry fun update_player(
        player_registry: &mut PlayerRegistry,
        player_id: u64,
        name: String,
        allocated_value: u64,
        position: u8,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&player_registry.players, player_id), EPlayerDoesNotExist);

        let player = table::borrow_mut(&mut player_registry.players, player_id);
        let owner = tx_context::sender(ctx);
        
        // Ensure only the squad owner can update their players
        assert!(player.squad_owner == owner, EOwnerDoesNotHaveSquad);

        player.name = name;
        player.allocated_value = allocated_value;
        player.position = position;
    }

    /// Deletes a squad (optional utility function).
    public entry fun delete_squad(
        registry: &mut SquadRegistry,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        assert!(table::contains(&registry.squads, owner), EOwnerDoesNotHaveSquad);
        
        let squad = table::remove(&mut registry.squads, owner);
        let Squad { id, owner: _, goalkeeper: _, defenders: _, midfielders: _, forwards: _, formation: _ } = squad;
        object::delete(id);
    }

    /// Gets squad formation type as a readable string (utility function).
    public fun formation_to_string(formation: &SquadFormation): String {
        if (formation.formation_type == FORMATION_4_3_2_1) {
            string::utf8(b"4-3-2-1")
        } else if (formation.formation_type == FORMATION_4_2_3_1) {
            string::utf8(b"4-2-3-1")
        } else if (formation.formation_type == FORMATION_4_2_2_2) {
            string::utf8(b"4-2-2-2")
        } else if (formation.formation_type == FORMATION_4_3_1_2) {
            string::utf8(b"4-3-1-2")
        } else if (formation.formation_type == FORMATION_4_2_1_3) {
            string::utf8(b"4-2-1-3")
        } else {
            string::utf8(b"Unknown")
        }
    }
}