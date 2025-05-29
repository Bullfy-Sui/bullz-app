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
    use bullfy::fee_collector;

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

    // Fee amount in MIST (1 SUI = 10^9 MIST)
    const SQUAD_CREATION_FEE: u64 = 1_000_000_000;

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
    }

    // Represents a player in a squad.
    public struct Player has key, store {
        id: UID,
        name: String,
        squad_owner: address, // Changed from squad_id to squad_owner for easier lookup
        token_price_id: String,
        allocated_value: u64,
        position: u8,
    }

    // Registry for all squads.
    public struct SquadRegistry has key {
        id: UID,
        squads: Table<u64, Squad>,
        owner_squads: Table<address, vector<u64>>,
        next_squad_id: u64,
    }

    // Registry for all players.
    public struct PlayerRegistry has key {
        id: UID,
        players: Table<u64, Player>,
        next_player_id: u64,
    }

    // Event emitted when a new squad is created.
    public struct SquadCreated has copy, drop {
        owner: address,
        squad_id: u64,
    }

    // Event emitted when a new player is created.
    public struct PlayerCreated has copy, drop {
        player_id: u64,
        squad_owner: address,
        name: String,
    }

    // Helper functions for formations
    public fun create_formation(formation_type: u8): SquadFormation {
        SquadFormation { formation_type }
    }

    public fun get_formation_type(formation: &SquadFormation): u8 {
        formation.formation_type
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

        let player_registry = PlayerRegistry {
            id: object::new(ctx),
            players: table::new(ctx),
            next_player_id: 1, // Start from 1 instead of 0
        };
        transfer::share_object(player_registry);
    }

    // Creates a new squad.
    public entry fun create_squad(
        registry: &mut SquadRegistry,
        fees: &mut fee_collector::Fees,
        payment: Coin<SUI>,
        name:String,
        goalkeeper: String,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation_type: u8,
        ctx: &mut TxContext
    ) {
        // Verify payment amount
        //let payment_amount = coin::value(&payment);
        let payment_amount = coin::value(&payment);
        //the logic is that a user cannot send a value less than 1 SUI

        
        assert!(payment_amount >= SQUAD_CREATION_FEE, EInsufficientFee);
        //wants to ensure that the fee charge is not more than 1 sui 


        assert!(vector::length(&defenders) >= 1, ENotEnoughDefenders);
        assert!(vector::length(&midfielders) >= 1, ENotEnoughMidfielders);
        assert!(vector::length(&forwards) >= 1, ENotEnoughForwards);

        let owner = tx_context::sender(ctx);
        let squad_id = registry.next_squad_id;
        registry.next_squad_id = squad_id + 1;

        let formation = create_formation(formation_type);
        let squad = Squad {
            id: object::new(ctx),
            owner,
            name,
            squad_id,
            goalkeeper: option::some(goalkeeper),
            defenders,
            midfielders,
            forwards,
            formation,
        };

        // Add the squad to the registry
        table::add(&mut registry.squads, squad_id, squad);

        // Add the squad to the owner's list of squads
        if (!table::contains(&registry.owner_squads, owner)) {
            table::add(&mut registry.owner_squads, owner, vector::empty<u64>());
        };
        
        let owner_squads = table::borrow_mut(&mut registry.owner_squads, owner);
        vector::push_back(owner_squads, squad_id);

        // Collect the fee
        fee_collector::collect(fees, payment, ctx);

        event::emit(SquadCreated { 
            owner,
            squad_id,
        });
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

    // Checks if an owner has any squads.
    public fun has_squads(registry: &SquadRegistry, owner: address): bool {
        table::contains(&registry.owner_squads, owner)
    }

    // Updates a squad.
    public entry fun update_squad(
        registry: &mut SquadRegistry,
        squad_id: u64,
        name: String,
        goalkeeper: String,
        defenders: vector<String>,
        midfielders: vector<String>,
        forwards: vector<String>,
        formation_type: u8,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        

        assert!(vector::length(&defenders) >= 1, ENotEnoughDefenders);
        assert!(vector::length(&midfielders) >= 1, ENotEnoughMidfielders);
        assert!(vector::length(&forwards) >= 1, ENotEnoughForwards);

        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        let owner = tx_context::sender(ctx);
        
        // Ensure only the squad owner can update it
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);

        squad.goalkeeper = option::some(goalkeeper);
        squad.defenders = defenders;
        squad.midfielders = midfielders;
        squad.forwards = forwards;
        squad.formation = create_formation(formation_type);
        squad.name = name;
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
        let owner = tx_context::sender(ctx);
        // Verify that the squad exists and belongs to the owner
        assert!(table::contains(&squad_registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow(&squad_registry.squads, squad_id);
        assert!(squad.owner == owner, EOwnerDoesNotHaveSquad);

        let player_id = player_registry.next_player_id;
        player_registry.next_player_id = player_id + 1;

        let player = Player {
            id: object::new(ctx),
            name,
            squad_owner: owner,
            token_price_id,
            allocated_value,
            position,
        };

        table::add(&mut player_registry.players, player_id, player);

        event::emit(PlayerCreated {
            player_id,
            squad_owner: owner,
            name,
        });
    }

    // Gets a player by ID.
    public fun get_player(player_registry: &PlayerRegistry, player_id: u64): &Player {
        assert!(table::contains(&player_registry.players, player_id), EPlayerDoesNotExist);
        table::borrow(&player_registry.players, player_id)
    }

    /// Checks if a player exists.
    public fun has_player(player_registry: &PlayerRegistry, player_id: u64): bool {
        table::contains(&player_registry.players, player_id)
    }

    // Updates a player.
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
        let Squad { id, owner: _, squad_id: _, goalkeeper: _, defenders: _, midfielders: _, forwards: _, formation: _,name: _ } = squad;
        object::delete(id);
    }

    // Gets squad formation type as a readable string (utility function).
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