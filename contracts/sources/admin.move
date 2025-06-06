
module bullfy::admin {
    use sui::event;

    // OwnerCap - special capability for the contract owner
    public struct OwnerCap has key {
        id: UID
    }

    // AdminCap to control admin-only functions
    public struct AdminCap has key {
        id: UID
    }

    // Events
    public struct AdminCapCreated has copy, drop {
        admin: address
    }

    public struct AdminCapRevoked has copy, drop {
        admin: address
    }

    // Init function to create the OwnerCap
    fun init(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        
        // Create and transfer the OwnerCap to the deployer
        let owner_cap = OwnerCap {
            id: object::new(ctx)
        };
        transfer::transfer(owner_cap, sender);
        
        // Create and transfer the first AdminCap to the deployer
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, sender);
        
        // Emit event for the first admin
        event::emit(AdminCapCreated { admin: sender });
    }

    // Create a new AdminCap and transfer it to the specified address
    public entry fun create_admin_cap(
        _: &OwnerCap,
        admin: address,
        ctx: &mut TxContext
    ) {
        // Create a new AdminCap
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        
        // Transfer the AdminCap to the new admin
        transfer::transfer(admin_cap, admin);
        
        // Emit event
        event::emit(AdminCapCreated { admin });
    }

    // Revoke an admin's capability by creating a burn function
    // The owner needs to get the AdminCap from the admin first (off-chain coordination)
    public entry fun revoke_admin_cap(
        _: &OwnerCap,
        admin_cap: AdminCap,
        admin: address
    ) {
        // Delete the AdminCap
        let AdminCap { id } = admin_cap;
        object::delete(id);
        
        // Emit event
        event::emit(AdminCapRevoked { admin });
    }

    // Transfer OwnerCap to a new owner
    public entry fun transfer_owner_cap(
        owner_cap: OwnerCap,
        new_owner: address
    ) {
        transfer::transfer(owner_cap, new_owner);
    }
}