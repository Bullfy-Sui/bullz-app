#[test_only]
module bullfy::admin_tests {
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use bullfy::admin::{Self, AdminCap, OwnerCap, FeeConfig};

    // Test constants
    const OWNER: address = @0xa;
    const ADMIN1: address = @0xb;
    const ADMIN2: address = @0xc;
    const NEW_OWNER: address = @0xd;

    // Helper function to initialize the contract using init_for_testing
    fun init_contract(scenario: &mut Scenario) {
        next_tx(scenario, OWNER);
        {
            let ctx = ctx(scenario);
            admin::init_for_testing(ctx);
        };
    }

    #[test]
    fun test_init_contract() {
        let mut scenario = test::begin(OWNER);
        
        // Initialize the contract
        init_contract(&mut scenario);
        
        // Check that OwnerCap was created and transferred to OWNER
        next_tx(&mut scenario, OWNER);
        {
            assert!(test::has_most_recent_for_address<OwnerCap>(OWNER), 0);
            assert!(test::has_most_recent_for_address<AdminCap>(OWNER), 1);
        };
        
        // Check that FeeConfig was created and shared
        next_tx(&mut scenario, OWNER);
        {
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            
            // Verify default values
            assert!(admin::get_upfront_fee_bps(&fee_config) == 500, 2); // 5%
            assert!(admin::get_squad_creation_fee(&fee_config) == 1_000_000_000, 3); // 1 SUI
            assert!(admin::get_standard_revival_fee(&fee_config) == 50_000_000, 4); // 0.05 SUI
            assert!(admin::get_instant_revival_fee(&fee_config) == 100_000_000, 5); // 0.1 SUI
            
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_create_admin_cap() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        // Owner creates an admin cap for ADMIN1
        next_tx(&mut scenario, OWNER);
        {
            let owner_cap = test::take_from_address<OwnerCap>(&scenario, OWNER);
            admin::create_admin_cap(&owner_cap, ADMIN1, ctx(&mut scenario));
            test::return_to_address(OWNER, owner_cap);
        };
        
        // Check that ADMIN1 received the AdminCap
        next_tx(&mut scenario, ADMIN1);
        {
            assert!(test::has_most_recent_for_address<AdminCap>(ADMIN1), 0);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_revoke_admin_cap() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        // Create admin cap for ADMIN1
        next_tx(&mut scenario, OWNER);
        {
            let owner_cap = test::take_from_address<OwnerCap>(&scenario, OWNER);
            admin::create_admin_cap(&owner_cap, ADMIN1, ctx(&mut scenario));
            test::return_to_address(OWNER, owner_cap);
        };
        
        // Revoke the admin cap (simulating off-chain coordination)
        next_tx(&mut scenario, OWNER);
        {
            let owner_cap = test::take_from_address<OwnerCap>(&scenario, OWNER);
            let admin_cap = test::take_from_address<AdminCap>(&scenario, ADMIN1);
            admin::revoke_admin_cap(&owner_cap, admin_cap, ADMIN1);
            test::return_to_address(OWNER, owner_cap);
        };
        
        // Verify admin cap no longer exists for ADMIN1
        next_tx(&mut scenario, ADMIN1);
        {
            assert!(!test::has_most_recent_for_address<AdminCap>(ADMIN1), 0);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_transfer_owner_cap() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        // Transfer owner cap to new owner
        next_tx(&mut scenario, OWNER);
        {
            let owner_cap = test::take_from_address<OwnerCap>(&scenario, OWNER);
            admin::transfer_owner_cap(owner_cap, NEW_OWNER);
        };
        
        // Check that NEW_OWNER received the OwnerCap
        next_tx(&mut scenario, NEW_OWNER);
        {
            assert!(test::has_most_recent_for_address<OwnerCap>(NEW_OWNER), 0);
        };
        
        // Check that OWNER no longer has the OwnerCap
        next_tx(&mut scenario, OWNER);
        {
            assert!(!test::has_most_recent_for_address<OwnerCap>(OWNER), 1);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_update_fee_percentage() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        // Update fee percentage
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            admin::update_fee_percentage(&admin_cap, &mut fee_config, 750, ctx(&mut scenario)); // 7.5%
            
            assert!(admin::get_upfront_fee_bps(&fee_config) == 750, 0);
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_update_fee_percentage_invalid_high() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        // Try to set fee percentage too high (over 10%)
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            admin::update_fee_percentage(&admin_cap, &mut fee_config, 1001, ctx(&mut scenario)); // 10.01%
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_update_squad_creation_fee() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            let new_fee = 500_000_000; // 0.5 SUI
            admin::update_squad_creation_fee(&admin_cap, &mut fee_config, new_fee, ctx(&mut scenario));
            
            assert!(admin::get_squad_creation_fee(&fee_config) == new_fee, 0);
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_update_squad_creation_fee_too_low() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            let invalid_fee = 50_000_000; // 0.05 SUI - below minimum
            admin::update_squad_creation_fee(&admin_cap, &mut fee_config, invalid_fee, ctx(&mut scenario));
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_update_squad_creation_fee_too_high() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            let invalid_fee = 15_000_000_000; // 15 SUI - above maximum
            admin::update_squad_creation_fee(&admin_cap, &mut fee_config, invalid_fee, ctx(&mut scenario));
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_update_revival_fees() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            let new_standard_fee = 20_000_000; // 0.02 SUI
            let new_instant_fee = 80_000_000; // 0.08 SUI
            
            admin::update_revival_fees(
                &admin_cap, 
                &mut fee_config, 
                new_standard_fee, 
                new_instant_fee, 
                ctx(&mut scenario)
            );
            
            assert!(admin::get_standard_revival_fee(&fee_config) == new_standard_fee, 0);
            assert!(admin::get_instant_revival_fee(&fee_config) == new_instant_fee, 1);
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_update_revival_fees_standard_too_low() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            let invalid_standard_fee = 5_000_000; // 0.005 SUI - below minimum
            let valid_instant_fee = 80_000_000; // 0.08 SUI
            
            admin::update_revival_fees(
                &admin_cap, 
                &mut fee_config, 
                invalid_standard_fee, 
                valid_instant_fee, 
                ctx(&mut scenario)
            );
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_update_revival_fees_instant_not_higher() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            let standard_fee = 50_000_000; // 0.05 SUI
            let instant_fee = 50_000_000; // 0.05 SUI - same as standard (should be higher)
            
            admin::update_revival_fees(
                &admin_cap, 
                &mut fee_config, 
                standard_fee, 
                instant_fee, 
                ctx(&mut scenario)
            );
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_multiple_admins() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        // Create admin caps for multiple admins
        next_tx(&mut scenario, OWNER);
        {
            let owner_cap = test::take_from_address<OwnerCap>(&scenario, OWNER);
            admin::create_admin_cap(&owner_cap, ADMIN1, ctx(&mut scenario));
            admin::create_admin_cap(&owner_cap, ADMIN2, ctx(&mut scenario));
            test::return_to_address(OWNER, owner_cap);
        };
        
        // Both admins should be able to update fees
        next_tx(&mut scenario, ADMIN1);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, ADMIN1);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            admin::update_fee_percentage(&admin_cap, &mut fee_config, 600, ctx(&mut scenario)); // 6%
            
            test::return_to_address(ADMIN1, admin_cap);
            test::return_shared(fee_config);
        };
        
        next_tx(&mut scenario, ADMIN2);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, ADMIN2);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            admin::update_squad_creation_fee(&admin_cap, &mut fee_config, 2_000_000_000, ctx(&mut scenario)); // 2 SUI
            
            assert!(admin::get_upfront_fee_bps(&fee_config) == 600, 0); // Should still be 6% from ADMIN1
            assert!(admin::get_squad_creation_fee(&fee_config) == 2_000_000_000, 1); // Should be 2 SUI from ADMIN2
            
            test::return_to_address(ADMIN2, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_fee_boundary_values() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let admin_cap = test::take_from_address<AdminCap>(&scenario, OWNER);
            let mut fee_config = test::take_shared<FeeConfig>(&scenario);
            
            // Test minimum and maximum valid values
            admin::update_fee_percentage(&admin_cap, &mut fee_config, 0, ctx(&mut scenario)); // 0%
            assert!(admin::get_upfront_fee_bps(&fee_config) == 0, 0);
            
            admin::update_fee_percentage(&admin_cap, &mut fee_config, 1000, ctx(&mut scenario)); // 10%
            assert!(admin::get_upfront_fee_bps(&fee_config) == 1000, 1);
            
            // Test squad creation fee boundaries
            admin::update_squad_creation_fee(&admin_cap, &mut fee_config, 100_000_000, ctx(&mut scenario)); // 0.1 SUI (min)
            assert!(admin::get_squad_creation_fee(&fee_config) == 100_000_000, 2);
            
            admin::update_squad_creation_fee(&admin_cap, &mut fee_config, 10_000_000_000, ctx(&mut scenario)); // 10 SUI (max)
            assert!(admin::get_squad_creation_fee(&fee_config) == 10_000_000_000, 3);
            
            // Test revival fee boundaries
            admin::update_revival_fees(&admin_cap, &mut fee_config, 10_000_000, 1_000_000_000, ctx(&mut scenario)); // 0.01 and 1 SUI
            assert!(admin::get_standard_revival_fee(&fee_config) == 10_000_000, 4);
            assert!(admin::get_instant_revival_fee(&fee_config) == 1_000_000_000, 5);
            
            test::return_to_address(OWNER, admin_cap);
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_getter_functions() {
        let mut scenario = test::begin(OWNER);
        init_contract(&mut scenario);
        
        next_tx(&mut scenario, OWNER);
        {
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            
            // Test all getter functions return correct default values
            assert!(admin::get_upfront_fee_bps(&fee_config) == 500, 0);
            assert!(admin::get_squad_creation_fee(&fee_config) == 1_000_000_000, 1);
            assert!(admin::get_standard_revival_fee(&fee_config) == 50_000_000, 2);
            assert!(admin::get_instant_revival_fee(&fee_config) == 100_000_000, 3);
            
            test::return_shared(fee_config);
        };
        
        test::end(scenario);
    }
}