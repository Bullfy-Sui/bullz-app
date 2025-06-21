module bullfy::match_signer {
    use sui::event;
    use bullfy::admin::{AdminCap, OwnerCap};

    // Error codes
    #[error]
    const ENotAuthorized: vector<u8> = b"Only authorized signers can perform this action";
    #[error]
    const ESignerAlreadyExists: vector<u8> = b"Signer capability already exists for this address";

    // MatchSignerCap - specific capability for backend services to complete matches
    public struct MatchSignerCap has key {
        id: UID,
        signer_address: address,
        created_at: u64,
        is_active: bool,
    }

    // Registry to track all active signers
    public struct SignerRegistry has key {
        id: UID,
        active_signers: vector<address>,
        signer_count: u64,
    }

    // Events
    public struct MatchSignerCreated has copy, drop {
        signer_address: address,
        created_by: address,
        created_at: u64,
    }

    public struct MatchSignerRevoked has copy, drop {
        signer_address: address,
        revoked_by: address,
        revoked_at: u64,
    }

    public struct MatchSignerDeactivated has copy, drop {
        signer_address: address,
        deactivated_at: u64,
    }

    public struct MatchSignerReactivated has copy, drop {
        signer_address: address,
        reactivated_at: u64,
    }

    // Initialize the signer registry
    fun init(ctx: &mut TxContext) {
        let registry = SignerRegistry {
            id: object::new(ctx),
            active_signers: vector::empty<address>(),
            signer_count: 0,
        };
        transfer::share_object(registry);
    }

    // Create a new MatchSignerCap for a backend service (admin only)
    public entry fun create_match_signer(
        _: &AdminCap,
        registry: &mut SignerRegistry,
        signer_address: address,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);

        // Check if signer already exists in active signers
        assert!(!vector::contains(&registry.active_signers, &signer_address), ESignerAlreadyExists);

        // Create the MatchSignerCap
        let signer_cap = MatchSignerCap {
            id: object::new(ctx),
            signer_address,
            created_at: current_time,
            is_active: true,
        };

        // Add to registry
        vector::push_back(&mut registry.active_signers, signer_address);
        registry.signer_count = registry.signer_count + 1;

        // Transfer the capability to the signer address
        transfer::transfer(signer_cap, signer_address);

        // Emit event
        event::emit(MatchSignerCreated {
            signer_address,
            created_by: sender,
            created_at: current_time,
        });
    }

    // Create a new MatchSignerCap using OwnerCap (for initial setup)
    public entry fun create_match_signer_with_owner(
        _: &OwnerCap,
        registry: &mut SignerRegistry,
        signer_address: address,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);

        // Check if signer already exists in active signers
        assert!(!vector::contains(&registry.active_signers, &signer_address), ESignerAlreadyExists);

        // Create the MatchSignerCap
        let signer_cap = MatchSignerCap {
            id: object::new(ctx),
            signer_address,
            created_at: current_time,
            is_active: true,
        };

        // Add to registry
        vector::push_back(&mut registry.active_signers, signer_address);
        registry.signer_count = registry.signer_count + 1;

        // Transfer the capability to the signer address
        transfer::transfer(signer_cap, signer_address);

        // Emit event
        event::emit(MatchSignerCreated {
            signer_address,
            created_by: sender,
            created_at: current_time,
        });
    }

    // Revoke a MatchSignerCap (admin only)
    public entry fun revoke_match_signer(
        _: &AdminCap,
        registry: &mut SignerRegistry,
        signer_cap: MatchSignerCap,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);
        let signer_address = signer_cap.signer_address;

        // Remove from active signers
        let (found, index) = vector::index_of(&registry.active_signers, &signer_address);
        if (found) {
            vector::remove(&mut registry.active_signers, index);
        };

        // Delete the capability
        let MatchSignerCap { id, signer_address: _, created_at: _, is_active: _ } = signer_cap;
        object::delete(id);

        // Emit event
        event::emit(MatchSignerRevoked {
            signer_address,
            revoked_by: sender,
            revoked_at: current_time,
        });
    }

    // Revoke a MatchSignerCap using OwnerCap
    public entry fun revoke_match_signer_with_owner(
        _: &OwnerCap,
        registry: &mut SignerRegistry,
        signer_cap: MatchSignerCap,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);
        let signer_address = signer_cap.signer_address;

        // Remove from active signers
        let (found, index) = vector::index_of(&registry.active_signers, &signer_address);
        if (found) {
            vector::remove(&mut registry.active_signers, index);
        };

        // Delete the capability
        let MatchSignerCap { id, signer_address: _, created_at: _, is_active: _ } = signer_cap;
        object::delete(id);

        // Emit event
        event::emit(MatchSignerRevoked {
            signer_address,
            revoked_by: sender,
            revoked_at: current_time,
        });
    }

    // Deactivate a signer (temporarily disable without revoking)
    public entry fun deactivate_signer(
        signer_cap: &mut MatchSignerCap,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);

        // Only the signer themselves can deactivate
        assert!(sender == signer_cap.signer_address, ENotAuthorized);
        
        signer_cap.is_active = false;

        // Emit event
        event::emit(MatchSignerDeactivated {
            signer_address: sender,
            deactivated_at: current_time,
        });
    }

    // Reactivate a signer
    public entry fun reactivate_signer(
        signer_cap: &mut MatchSignerCap,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);

        // Only the signer themselves can reactivate
        assert!(sender == signer_cap.signer_address, ENotAuthorized);
        
        signer_cap.is_active = true;

        // Emit event
        event::emit(MatchSignerReactivated {
            signer_address: sender,
            reactivated_at: current_time,
        });
    }

    // Validation function to check if a signer is authorized and active
    public fun validate_match_signer(signer_cap: &MatchSignerCap, ctx: &TxContext): bool {
        let sender = tx_context::sender(ctx);
        sender == signer_cap.signer_address && signer_cap.is_active
    }

    // Check if an address is an active signer
    public fun is_active_signer(registry: &SignerRegistry, signer_address: address): bool {
        vector::contains(&registry.active_signers, &signer_address)
    }

    // Get all active signers
    public fun get_active_signers(registry: &SignerRegistry): &vector<address> {
        &registry.active_signers
    }

    // Get signer count
    public fun get_signer_count(registry: &SignerRegistry): u64 {
        registry.signer_count
    }

    // Get signer info
    public fun get_signer_info(signer_cap: &MatchSignerCap): (address, u64, bool) {
        (signer_cap.signer_address, signer_cap.created_at, signer_cap.is_active)
    }

    // Test helper function to create a signer cap for testing
    #[test_only]
    public fun create_test_signer_cap(ctx: &mut TxContext): MatchSignerCap {
        let sender = tx_context::sender(ctx);
        MatchSignerCap {
            id: object::new(ctx),
            signer_address: sender,
            created_at: 0,
            is_active: true,
        }
    }
} 