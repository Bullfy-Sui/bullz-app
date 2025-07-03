#[allow(unused_const,lint(custom_state_change),duplicate_alias)]
module bullfy::admin {
    use sui::event;
    use sui::clock::{Self, Clock};

    // Error codes with descriptive messages
    #[error]
    const ENotOwner: vector<u8> = b"Only the owner can perform this action";
    #[error]
    const EInvalidFeePercentage: vector<u8> = b"Fee percentage must be between 0 and 1000 (0-10%)";
    #[error]
    const EInvalidSquadCreationFee: vector<u8> = b"Squad creation fee must be between 100000000 and 10000000000 MIST (0.1-10 SUI)";
    #[error]
    const EInvalidRevivalFee: vector<u8> = b"Revival fee must be between 10000000 and 1000000000 MIST (0.01-1 SUI)";
    #[error]
    const EAdminNotFound: vector<u8> = b"Admin not found in registry";
    #[error]
    const EAdminAlreadyExists: vector<u8> = b"Admin already exists in registry";

    // Constants
    const MAX_FEE_BPS: u64 = 1000; // Maximum 10% fee
    const MIN_SQUAD_CREATION_FEE: u64 = 100_000_000; // Minimum 0.1 SUI
    const MAX_SQUAD_CREATION_FEE: u64 = 10_000_000_000; // Maximum 10 SUI
    const MIN_REVIVAL_FEE: u64 = 10_000_000; // Minimum 0.01 SUI
    const MAX_REVIVAL_FEE: u64 = 1_000_000_000; // Maximum 1 SUI

    // AdminCap to control admin-only functions
    public struct AdminCap has key {
        id: UID,
        admin_address: address,
        created_at: u64,
        is_active: bool,
    }

    // OwnerCap - special capability for the contract owner
    public struct OwnerCap has key {
        id: UID
    }

    // Admin registry to track all admins
    public struct AdminRegistry has key {
        id: UID,
        active_admins: vector<address>,
        admin_count: u64,
    }

    // Global fee configuration
    public struct FeeConfig has key {
        id: UID,
        upfront_fee_bps: u64, // Fee in basis points (e.g., 500 = 5%)
        squad_creation_fee: u64, // Squad creation fee in MIST
        standard_revival_fee: u64, // Standard revival fee after 24hr wait in MIST
        instant_revival_fee: u64, // Instant revival fee in MIST
    }

    // Events
    public struct AdminCapCreated has copy, drop {
        admin: address,
        created_at: u64,
    }

    public struct AdminCapRevoked has copy, drop {
        admin: address,
        revoked_at: u64,
    }

    public struct AdminDeactivated has copy, drop {
        admin: address,
        deactivated_at: u64,
    }

    public struct AdminReactivated has copy, drop {
        admin: address,
        reactivated_at: u64,
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

    public struct RevivalFeesUpdated has copy, drop {
        old_standard_fee: u64,
        new_standard_fee: u64,
        old_instant_fee: u64,
        new_instant_fee: u64,
        updated_by: address,
    }

    // Init function to create the OwnerCap and AdminRegistry
    fun init(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        
        // Create and transfer the OwnerCap to the deployer
        let owner_cap = OwnerCap {
            id: object::new(ctx)
        };
        transfer::transfer(owner_cap, sender);
        
        // Create admin registry
        let admin_registry = AdminRegistry {
            id: object::new(ctx),
            active_admins: vector::empty<address>(),
            admin_count: 0,
        };
        transfer::share_object(admin_registry);

        // Create global fee configuration with defaults
        let fee_config = FeeConfig {
            id: object::new(ctx),
            upfront_fee_bps: 500, // 5% default fee
            squad_creation_fee: 1_000_000_000, // 1 SUI default fee
            standard_revival_fee: 50_000_000, // 0.05 SUI default fee
            instant_revival_fee: 100_000_000, // 0.1 SUI default fee
        };
        transfer::share_object(fee_config);
        
        // Note: First admin will be created separately using create_admin_cap 
        // because we dont create in the init function
    }

    // Creates an admin capability.
    entry fun create_admin_cap(
        _: &OwnerCap,
        registry: &mut AdminRegistry,
        admin: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Check if admin already exists
        assert!(!vector::contains(&registry.active_admins, &admin), EAdminAlreadyExists);
        
        // Create a new AdminCap
        let admin_cap = AdminCap {
            id: object::new(ctx),
            admin_address: admin,
            created_at: current_time,
            is_active: true,
        };
        
        // Add to registry
        vector::push_back(&mut registry.active_admins, admin);
        registry.admin_count = registry.admin_count + 1;
        
        // Transfer the AdminCap to the new admin
        transfer::transfer(admin_cap, admin);
        
        // Emit event
        event::emit(AdminCapCreated { 
            admin,
            created_at: current_time,
        });
    }

    // Revokes an admin capability.
    entry fun revoke_admin_cap(
        _: &OwnerCap,
        registry: &mut AdminRegistry,
        admin_cap: AdminCap,
        clock: &Clock
    ) {
        let current_time = clock::timestamp_ms(clock);
        let admin = admin_cap.admin_address;
        
        // Remove from registry
        let (found, index) = vector::index_of(&registry.active_admins, &admin);
        assert!(found, EAdminNotFound);
        vector::remove(&mut registry.active_admins, index);
        
        // Delete the AdminCap
        let AdminCap { id, admin_address: _, created_at: _, is_active: _ } = admin_cap;
        object::delete(id);
        
        // Emit event
        event::emit(AdminCapRevoked { 
            admin,
            revoked_at: current_time,
        });
    }

    // Deactivate an admin
    entry fun deactivate_admin(
        admin_cap: &mut AdminCap,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        // Validate that sender owns this admin cap
        assert!(admin_cap.admin_address == sender, ENotOwner);
        assert!(admin_cap.is_active, EAdminNotFound);
        
        admin_cap.is_active = false;
        
        // Emit event
        event::emit(AdminDeactivated {
            admin: sender,
            deactivated_at: current_time,
        });
    }

    // Reactivate an admin
    entry fun reactivate_admin(
        admin_cap: &mut AdminCap,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        // Validate that sender owns this admin cap
        assert!(admin_cap.admin_address == sender, ENotOwner);
        assert!(!admin_cap.is_active, EAdminNotFound);
        
        admin_cap.is_active = true;
        
        // Emit event
        event::emit(AdminReactivated {
            admin: sender,
            reactivated_at: current_time,
        });
    }

    // Validate admin capability and activity status
    public fun validate_admin_cap(admin_cap: &AdminCap, ctx: &mut TxContext): bool {
        let sender = tx_context::sender(ctx);
        admin_cap.admin_address == sender && admin_cap.is_active
    }

    // Transfer the owner capability to a new address
    entry fun transfer_owner_cap(
        owner_cap: OwnerCap,
        new_owner: address
    ) {
        transfer::transfer(owner_cap, new_owner);
    }

    // Update the fee percentage for squads
    entry fun update_fee_percentage(
        admin_cap: &AdminCap,
        fee_config: &mut FeeConfig,
        new_fee_bps: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate admin capability
        assert!(validate_admin_cap(admin_cap, ctx), ENotOwner);
        
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

    // Update the squad creation fee
    entry fun update_squad_creation_fee(
        admin_cap: &AdminCap,
        fee_config: &mut FeeConfig,
        new_fee: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate admin capability
        assert!(validate_admin_cap(admin_cap, ctx), ENotOwner);
        
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

    // Update the revival fees
    entry fun update_revival_fees(
        admin_cap: &AdminCap,
        fee_config: &mut FeeConfig,
        new_standard_fee: u64,
        new_instant_fee: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate admin capability
        assert!(validate_admin_cap(admin_cap, ctx), ENotOwner);
        
        // Validate fee amounts
        assert!(new_standard_fee >= MIN_REVIVAL_FEE && new_standard_fee <= MAX_REVIVAL_FEE, EInvalidRevivalFee);
        assert!(new_instant_fee >= MIN_REVIVAL_FEE && new_instant_fee <= MAX_REVIVAL_FEE, EInvalidRevivalFee);
        assert!(new_instant_fee > new_standard_fee, EInvalidRevivalFee); // Instant should be more expensive
        
        let old_standard_fee = fee_config.standard_revival_fee;
        let old_instant_fee = fee_config.instant_revival_fee;
        
        fee_config.standard_revival_fee = new_standard_fee;
        fee_config.instant_revival_fee = new_instant_fee;
        
        // Emit event
        event::emit(RevivalFeesUpdated {
            old_standard_fee,
            new_standard_fee,
            old_instant_fee,
            new_instant_fee,
            updated_by: sender,
        });
    }

    // Query functions for admin registry
    public fun is_active_admin(registry: &AdminRegistry, admin_address: address): bool {
        vector::contains(&registry.active_admins, &admin_address)
    }

    public fun get_active_admins(registry: &AdminRegistry): &vector<address> {
        &registry.active_admins
    }

    public fun get_admin_count(registry: &AdminRegistry): u64 {
        registry.admin_count
    }

    public fun get_admin_info(admin_cap: &AdminCap): (address, u64, bool) {
        (admin_cap.admin_address, admin_cap.created_at, admin_cap.is_active)
    }

    // Get current upfront fee percentage
    public fun get_upfront_fee_bps(fee_config: &FeeConfig): u64 {
        fee_config.upfront_fee_bps
    }

    // Get current squad creation fee
    public fun get_squad_creation_fee(fee_config: &FeeConfig): u64 {
        fee_config.squad_creation_fee
    }

    // Get standard revival fee (after 24hr wait)
    public fun get_standard_revival_fee(fee_config: &FeeConfig): u64 {
        fee_config.standard_revival_fee
    }

    // Get instant revival fee
    public fun get_instant_revival_fee(fee_config: &FeeConfig): u64 {
        fee_config.instant_revival_fee
    }

    // Test helper function (for testing only)
    #[test_only]
    public fun create_admin_cap_for_testing(ctx: &mut TxContext): AdminCap {
        AdminCap {
            id: object::new(ctx),
            admin_address: tx_context::sender(ctx),
            created_at: 0,
            is_active: true,
        }
    }
} 