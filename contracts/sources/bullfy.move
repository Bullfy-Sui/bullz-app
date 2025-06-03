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
    const EInsufficientFee: vector<u8> = b"Insufficient fee provided";
    #[error]
    const EOwnerAlreadyHasSquad: vector<u8> = b"Owner already has a squad";
    #[error]
    const EOwnerDoesNotHaveSquad: vector<u8> = b"Owner does not have a squad";
    #[error]
    const ESquadHasNoLife: vector<u8> = b"Squad has no life remaining";

    // Fee amount in MIST (1 SUI = 10^9 MIST)
    const SQUAD_CREATION_FEE: u64 = 1_000_000_000;
    
    // Initial squad life points
    const INITIAL_SQUAD_LIFE: u64 = 5;

    // Represents a football squad.
    public struct Squad has key, store {
        id: UID,
        owner: address,
        squad_id: u64,
        name: String,
        players: vector<String>,
        life: u64,               // Life points (starts at 5)
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
        registry: &mut SquadRegistry,
        fees: &mut fee_collector::Fees,
        mut payment: Coin<SUI>,
        name: String,
        ctx: &mut TxContext
    ) {
        // Verify payment amount
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= SQUAD_CREATION_FEE, EInsufficientFee);

        let owner = tx_context::sender(ctx);
        let squad_id = registry.next_squad_id;
        registry.next_squad_id = squad_id + 1;

        let squad = Squad {
            id: object::new(ctx),
            owner,
            squad_id,
            name,
            players: vector::empty<String>(), // Initialize with empty vector
            life: INITIAL_SQUAD_LIFE,         // Start with 5 life points
        };

        // Add the squad to the registry
        table::add(&mut registry.squads, squad_id, squad);

        // Add the squad to the owner's list of squads
        if (!table::contains(&registry.owner_squads, owner)) {
            table::add(&mut registry.owner_squads, owner, vector::empty<u64>());
        };
        
        let owner_squads = table::borrow_mut(&mut registry.owner_squads, owner);
        vector::push_back(owner_squads, squad_id);

        // Handle payment: take only the required fee, return the rest
        if (payment_amount == SQUAD_CREATION_FEE) {
            // Exact payment, use the whole coin
            fee_collector::collect(fees, payment, ctx);
        } else {
            // More than required, split and return change
            let fee_coin = coin::split(&mut payment, SQUAD_CREATION_FEE, ctx);
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

    // Checks if a squad is still alive (has life > 0).
    public fun is_squad_alive(squad: &Squad): bool {
        squad.life > 0
    }

    // Decreases squad life by 1 (used when squad loses competition).
    public fun decrease_squad_life(registry: &mut SquadRegistry, squad_id: u64) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        assert!(squad.life > 0, ESquadHasNoLife);
        
        squad.life = squad.life - 1;
        
        event::emit(SquadLifeLost {
            squad_id,
            remaining_life: squad.life,
        });
    }

    // Increases squad life by specified amount (used when squad wins competition).
    public fun increase_squad_life(registry: &mut SquadRegistry, squad_id: u64, life_gained: u64) {
        assert!(table::contains(&registry.squads, squad_id), EOwnerDoesNotHaveSquad);
        let squad = table::borrow_mut(&mut registry.squads, squad_id);
        
        squad.life = squad.life + life_gained;
        
        event::emit(SquadLifeGained {
            squad_id,
            life_gained,
            new_life: squad.life,
        });
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
        let Squad { id, owner: _, squad_id: _, name: _, players: _, life: _ } = squad;
        object::delete(id);
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
}