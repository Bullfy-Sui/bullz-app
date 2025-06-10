#[allow(unused_const,lint(custom_state_change),duplicate_alias)]
module bullfy::admin {
    use sui::event;

    // Error codes with descriptive messages
    #[error]
    const ENotOwner: vector<u8> = b"Only the owner can perform this action";
    #[error]
    const EInvalidFeePercentage: vector<u8> = b"Fee percentage must be between 0 and 1000 (0-10%)";
    #[error]
    const EInvalidSquadCreationFee: vector<u8> = b"Squad creation fee must be between 100000000 and 10000000000 MIST (0.1-10 SUI)";

    // Constants
    const MAX_FEE_BPS: u64 = 1000; // Maximum 10% fee
    const MIN_SQUAD_CREATION_FEE: u64 = 100_000_000; // Minimum 0.1 SUI
    const MAX_SQUAD_CREATION_FEE: u64 = 10_000_000_000; // Maximum 10 SUI

    // AdminCap to control admin-only functions
    public struct AdminCap has key {
        id: UID
    }

    // OwnerCap - special capability for the contract owner
    public struct OwnerCap has key {
        id: UID
    }

    // Global fee configuration
    public struct FeeConfig has key {
        id: UID,
        upfront_fee_bps: u64, // Fee in basis points (e.g., 500 = 5%)
        squad_creation_fee: u64, // Squad creation fee in MIST
    }

    // Events
    public struct AdminCapCreated has copy, drop {
        admin: address
    }

    public struct AdminCapRevoked has copy, drop {
        admin: address
    }

    public struct FeePercentageUpdated has copy, drop {
        old_fee_bps: u64,
        new_fee_bps: u64,
        updated_by: address,
    }

    public struct SquadCreationFeeUpdated has copy, drop {
        old_fee: u64,
        new_fee: u64,
        updated_by: address,
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

        // Create global fee configuration with defaults
        let fee_config = FeeConfig {
            id: object::new(ctx),
            upfront_fee_bps: 500, // 5% default fee
            squad_creation_fee: 1_000_000_000, // 1 SUI default fee
        };
        transfer::share_object(fee_config);
        
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

    // Update the upfront fee percentage (admin only)
    public entry fun update_fee_percentage(
        _: &AdminCap,
        fee_config: &mut FeeConfig,
        new_fee_bps: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate fee percentage (0-10%)
        assert!(new_fee_bps <= MAX_FEE_BPS, EInvalidFeePercentage);
        
        let old_fee_bps = fee_config.upfront_fee_bps;
        fee_config.upfront_fee_bps = new_fee_bps;
        
        // Emit event
        event::emit(FeePercentageUpdated {
            old_fee_bps,
            new_fee_bps,
            updated_by: sender,
        });
    }

    // Update the squad creation fee (admin only)
    public entry fun update_squad_creation_fee(
        _: &AdminCap,
        fee_config: &mut FeeConfig,
        new_fee: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate fee amount (0.1-10 SUI)
        assert!(new_fee >= MIN_SQUAD_CREATION_FEE && new_fee <= MAX_SQUAD_CREATION_FEE, EInvalidSquadCreationFee);
        
        let old_fee = fee_config.squad_creation_fee;
        fee_config.squad_creation_fee = new_fee;
        
        // Emit event
        event::emit(SquadCreationFeeUpdated {
            old_fee,
            new_fee,
            updated_by: sender,
        });
    }

    // Get current upfront fee percentage
    public fun get_upfront_fee_bps(fee_config: &FeeConfig): u64 {
        fee_config.upfront_fee_bps
    }

    // Get current squad creation fee
    public fun get_squad_creation_fee(fee_config: &FeeConfig): u64 {
        fee_config.squad_creation_fee
    }
} 