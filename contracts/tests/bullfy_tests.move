#[test_only]
module bullfy::squad_manager_tests {
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use sui::clock;
    use sui::coin;
    use sui::sui::SUI;
    //use sui::test_utils;
    use std::string::{Self, String};
    //use std::vector;
    //use std::option;
    use bullfy::squad_manager::{Self, SquadRegistry, Squad};
    use bullfy::fee_collector::{Self, Fees};
    use bullfy::admin::{Self, FeeConfig, AdminCap};

    // Test addresses
    const ADMIN: address = @0xA;
    const PLAYER1: address = @0xB;
    const PLAYER2: address = @0xC;

    // Test constants
    const SQUAD_CREATION_FEE: u64 = 50_000_000; // 0.05 SUI
    const STANDARD_REVIVAL_FEE: u64 = 50_000_000; // 0.05 SUI
    const INSTANT_REVIVAL_FEE: u64 = 100_000_000; // 0.1 SUI
    const MIST_PER_SUI: u64 = 1_000_000_000;
    const REVIVAL_WAIT_TIME_MS: u64 = 864_00_000; // 24 hours in milliseconds

    // Helper function to create test scenario
    fun create_test_scenario(): Scenario {
        test::begin(ADMIN)
    }

    // Helper function to setup initial state
    fun setup_test_environment(scenario: &mut Scenario) {
        // Initialize squad manager
        next_tx(scenario, ADMIN);
        {
            squad_manager::init_for_testing(ctx(scenario));
        };

        // Initialize fee collector
        next_tx(scenario, ADMIN);
        {
            fee_collector::init_for_testing(ctx(scenario));
        };

        // Initialize admin and fee config
        next_tx(scenario, ADMIN);
        {
            admin::init_for_testing(ctx(scenario));
        };

        // Set up fee configuration
        next_tx(scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<AdminCap>(scenario);
            let mut fee_config = test::take_shared<FeeConfig>(scenario);
            
            admin::set_squad_creation_fee(&admin_cap, &mut fee_config, SQUAD_CREATION_FEE);
            admin::set_standard_revival_fee(&admin_cap, &mut fee_config, STANDARD_REVIVAL_FEE);
            admin::set_instant_revival_fee(&admin_cap, &mut fee_config, INSTANT_REVIVAL_FEE);
            
            test::return_to_sender(scenario, admin_cap);
            test::return_shared(fee_config);
        };
    }

    // Helper function to create a test squad
    fun create_test_squad(scenario: &mut Scenario, owner: address, squad_name: String): u64 {
        next_tx(scenario, owner);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(scenario);
            let fee_config = test::take_shared<FeeConfig>(scenario);
            let mut fees = test::take_shared<Fees>(scenario);
            let payment = coin::mint_for_testing<SUI>(SQUAD_CREATION_FEE, ctx(scenario));

            squad_manager::create_squad(
                &mut squad_registry,
                &fee_config,
                &mut fees,
                squad_name,
                payment,
                ctx(scenario)
            );

            test::return_shared(squad_registry);
            test::return_shared(fee_config);
            test::return_shared(fees);
        };
        1 // First squad ID
    }

    // Helper function to create player names vector
    fun create_player_names(): vector<String> {
        let mut players = vector::empty<String>();
        vector::push_back(&mut players, string::utf8(b"Player1"));
        vector::push_back(&mut players, string::utf8(b"Player2"));
        vector::push_back(&mut players, string::utf8(b"Player3"));
        vector::push_back(&mut players, string::utf8(b"Player4"));
        vector::push_back(&mut players, string::utf8(b"Player5"));
        vector::push_back(&mut players, string::utf8(b"Player6"));
        vector::push_back(&mut players, string::utf8(b"Player7"));
        players
    }

    // Helper function to kill a squad completely
    fun kill_squad(scenario: &mut Scenario, squad_id: u64) {
        next_tx(scenario, ADMIN);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(scenario);
            let clock = clock::create_for_testing(ctx(scenario));
            
            // Decrease life 5 times to kill the squad
            let mut i = 0;
            while (i < 5) {
                squad_manager::decrease_squad_life(&mut squad_registry, squad_id, &clock);
                i = i + 1;
            };
            
            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
        };
    }

    #[test]
    fun test_create_squad_success() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Verify squad was created correctly
        next_tx(&mut scenario, PLAYER1);
        {
            let squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            assert!(squad_manager::has_squads(&squad_registry, PLAYER1), 0);
            
            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(squad_manager::get_squad_name(squad) == &squad_name, 1);
            assert!(squad_manager::get_squad_owner(squad) == PLAYER1, 2);
            assert!(squad_manager::get_squad_life(squad) == 5, 3);
            assert!(squad_manager::is_squad_alive(squad), 4);
            assert!(vector::length(squad_manager::get_squad_players(squad)) == 0, 5);
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_create_squad_invalid_name_too_short() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b""); // Empty name
        create_test_squad(&mut scenario, PLAYER1, squad_name);

        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_create_squad_invalid_name_too_long() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        // Create a name longer than 50 characters
        let squad_name = string::utf8(b"This is a very long squad name that exceeds the maximum allowed length");
        create_test_squad(&mut scenario, PLAYER1, squad_name);

        test::end(scenario);
    }

    #[test]
    fun test_add_players_to_squad_success() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);
        let players = create_player_names();

        // Add players to squad
        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            squad_manager::add_players_to_squad(
                &mut squad_registry,
                squad_id,
                players,
                ctx(&mut scenario)
            );
            
            test::return_shared(squad_registry);
        };

        // Verify players were added
        next_tx(&mut scenario, PLAYER1);
        {
            let squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            
            assert!(vector::length(squad_manager::get_squad_players(squad)) == 7, 0);
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_add_players_wrong_number() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);
        
        // Try to add only 5 players (should fail)
        let mut players = vector::empty<String>();
        vector::push_back(&mut players, string::utf8(b"Player1"));
        vector::push_back(&mut players, string::utf8(b"Player2"));
        vector::push_back(&mut players, string::utf8(b"Player3"));
        vector::push_back(&mut players, string::utf8(b"Player4"));
        vector::push_back(&mut players, string::utf8(b"Player5"));

        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            squad_manager::add_players_to_squad(
                &mut squad_registry,
                squad_id,
                players,
                ctx(&mut scenario)
            );
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_add_duplicate_players() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);
        
        // Create players list with duplicates
        let mut players = vector::empty<String>();
        vector::push_back(&mut players, string::utf8(b"Player1"));
        vector::push_back(&mut players, string::utf8(b"Player1")); // Duplicate
        vector::push_back(&mut players, string::utf8(b"Player3"));
        vector::push_back(&mut players, string::utf8(b"Player4"));
        vector::push_back(&mut players, string::utf8(b"Player5"));
        vector::push_back(&mut players, string::utf8(b"Player6"));
        vector::push_back(&mut players, string::utf8(b"Player7"));

        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            squad_manager::add_players_to_squad(
                &mut squad_registry,
                squad_id,
                players,
                ctx(&mut scenario)
            );
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    fun test_squad_life_management() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Test decreasing life
        next_tx(&mut scenario, ADMIN);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));
            
            squad_manager::decrease_squad_life(&mut squad_registry, squad_id, &clock);
            
            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(squad_manager::get_squad_life(squad) == 4, 0);
            assert!(squad_manager::is_squad_alive(squad), 1);
            
            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
        };

        // Test increasing life
        next_tx(&mut scenario, ADMIN);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            squad_manager::increase_squad_life(&mut squad_registry, squad_id);
            
            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(squad_manager::get_squad_life(squad) == 5, 2);
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    fun test_squad_death_and_instant_revival() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Kill the squad
        kill_squad(&mut scenario, squad_id);

        // Verify squad is dead
        next_tx(&mut scenario, PLAYER1);
        {
            let squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(squad_manager::get_squad_life(squad) == 0, 0);
            assert!(!squad_manager::is_squad_alive(squad), 1);
            assert!(option::is_some(&squad_manager::get_squad_death_time(squad)), 2);
            test::return_shared(squad_registry);
        };

        // Test instant revival
        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            let mut fees = test::take_shared<Fees>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(INSTANT_REVIVAL_FEE, ctx(&mut scenario));

            squad_manager::revive_squad_instant(
                &mut squad_registry,
                &fee_config,
                &mut fees,
                squad_id,
                payment,
                &clock,
                ctx(&mut scenario)
            );

            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(squad_manager::get_squad_life(squad) == 5, 3);
            assert!(squad_manager::is_squad_alive(squad), 4);
            assert!(option::is_none(&squad_manager::get_squad_death_time(squad)), 5);

            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
            test::return_shared(fee_config);
            test::return_shared(fees);
        };

        test::end(scenario);
    }

    #[test]
    fun test_standard_revival_after_waiting_period() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Kill the squad
        kill_squad(&mut scenario, squad_id);

        // Test standard revival after 24 hours
        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            let mut fees = test::take_shared<Fees>(&scenario);
            
            // Create clock with 24+ hours passed
            let mut clock = clock::create_for_testing(ctx(&mut scenario));
            clock::increment_for_testing(&mut clock, REVIVAL_WAIT_TIME_MS + 1); // 24 hours + 1ms
            
            let payment = coin::mint_for_testing<SUI>(STANDARD_REVIVAL_FEE, ctx(&mut scenario));

            squad_manager::revive_squad_standard(
                &mut squad_registry,
                &fee_config,
                &mut fees,
                squad_id,
                payment,
                &clock,
                ctx(&mut scenario)
            );

            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(squad_manager::get_squad_life(squad) == 5, 0);
            assert!(squad_manager::is_squad_alive(squad), 1);

            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
            test::return_shared(fee_config);
            test::return_shared(fees);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_standard_revival_too_early() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Kill the squad
        kill_squad(&mut scenario, squad_id);

        // Try standard revival before 24 hours (should fail)
        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            let mut fees = test::take_shared<Fees>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(STANDARD_REVIVAL_FEE, ctx(&mut scenario));

            squad_manager::revive_squad_standard(
                &mut squad_registry,
                &fee_config,
                &mut fees,
                squad_id,
                payment,
                &clock,
                ctx(&mut scenario)
            );

            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
            test::return_shared(fee_config);
            test::return_shared(fees);
        };

        test::end(scenario);
    }

    #[test]
    fun test_delete_squad() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Delete the squad
        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            squad_manager::delete_squad(
                &mut squad_registry,
                squad_id,
                ctx(&mut scenario)
            );
            
            test::return_shared(squad_registry);
        };

        // Verify squad is deleted
        next_tx(&mut scenario, PLAYER1);
        {
            let squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            // Should not have any squads now
            assert!(!squad_manager::has_squads(&squad_registry, PLAYER1), 0);
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    fun test_payment_calculation_helpers() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        next_tx(&mut scenario, ADMIN);
        {
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            
            let creation_payment = squad_manager::calculate_squad_creation_payment(&fee_config);
            let standard_revival_payment = squad_manager::calculate_standard_revival_payment(&fee_config);
            let instant_revival_payment = squad_manager::calculate_instant_revival_payment(&fee_config);
            
            assert!(creation_payment == SQUAD_CREATION_FEE, 0);
            assert!(standard_revival_payment == STANDARD_REVIVAL_FEE, 1);
            assert!(instant_revival_payment == INSTANT_REVIVAL_FEE, 2);
            
            test::return_shared(fee_config);
        };

        test::end(scenario);
    }

    #[test]
    fun test_revival_check_functions() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Test with alive squad
        next_tx(&mut scenario, PLAYER1);
        {
            let squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));
            
            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(!squad_manager::can_revive_squad_standard(squad, &clock), 0);
            assert!(!squad_manager::can_revive_squad_instant(squad), 1);
            
            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
        };

        // Kill the squad
        kill_squad(&mut scenario, squad_id);

        // Test with dead squad
        next_tx(&mut scenario, PLAYER1);
        {
            let squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let mut clock = clock::create_for_testing(ctx(&mut scenario));
            
            let squad = squad_manager::get_squad(&squad_registry, squad_id);
            assert!(!squad_manager::can_revive_squad_standard(squad, &clock), 2); // Too early
            assert!(squad_manager::can_revive_squad_instant(squad), 3); // Can instant revive
            
            // Advance time by 24+ hours
            clock::increment_for_testing(&mut clock, REVIVAL_WAIT_TIME_MS + 1);
            assert!(squad_manager::can_revive_squad_standard(squad, &clock), 4); // Now can standard revive
            
            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    fun test_multiple_squads_per_owner() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        // Create multiple squads for the same owner
        let squad_name1 = string::utf8(b"Squad 1");
        let squad_name2 = string::utf8(b"Squad 2");
        
        let squad_id1 = create_test_squad(&mut scenario, PLAYER1, squad_name1);
        
        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            let mut fees = test::take_shared<Fees>(&scenario);
            let payment = coin::mint_for_testing<SUI>(SQUAD_CREATION_FEE, ctx(&mut scenario));

            squad_manager::create_squad(
                &mut squad_registry,
                &fee_config,
                &mut fees,
                squad_name2,
                payment,
                ctx(&mut scenario)
            );

            test::return_shared(squad_registry);
            test::return_shared(fee_config);
            test::return_shared(fees);
        };

        // Verify both squads exist
        next_tx(&mut scenario, PLAYER1);
        {
            let squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            let owner_squads = squad_manager::get_owner_squads(&squad_registry, PLAYER1);
            assert!(vector::length(owner_squads) == 2, 0);
            
            let squad1 = squad_manager::get_squad(&squad_registry, squad_id1);
            let squad2 = squad_manager::get_squad(&squad_registry, 2); // Second squad
            
            assert!(squad_manager::get_squad_name(squad1) == &squad_name1, 1);
            assert!(squad_manager::get_squad_name(squad2) == &squad_name2, 2);
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_revive_alive_squad() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Try to revive an alive squad (should fail)
        next_tx(&mut scenario, PLAYER1);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            let fee_config = test::take_shared<FeeConfig>(&scenario);
            let mut fees = test::take_shared<Fees>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));
            let payment = coin::mint_for_testing<SUI>(INSTANT_REVIVAL_FEE, ctx(&mut scenario));

            squad_manager::revive_squad_instant(
                &mut squad_registry,
                &fee_config,
                &mut fees,
                squad_id,
                payment,
                &clock,
                ctx(&mut scenario)
            );

            clock::destroy_for_testing(clock);
            test::return_shared(squad_registry);
            test::return_shared(fee_config);
            test::return_shared(fees);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_unauthorized_squad_access() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);

        let squad_name = string::utf8(b"Test Squad");
        let squad_id = create_test_squad(&mut scenario, PLAYER1, squad_name);

        // Try to delete squad with wrong owner (should fail)
        next_tx(&mut scenario, PLAYER2);
        {
            let mut squad_registry = test::take_shared<SquadRegistry>(&scenario);
            
            squad_manager::delete_squad(
                &mut squad_registry,
                squad_id,
                ctx(&mut scenario)
            );
            
            test::return_shared(squad_registry);
        };

        test::end(scenario);
    }
}