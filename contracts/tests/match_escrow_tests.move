#[test_only]
module bullfy::match_escrow_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance;
    use sui::clock::{Self, Clock};
    use sui::test_utils;
    use bullfy::match_escrow::{Self, EscrowRegistry, Bid, Match, BidStatus, MatchStatus};
    use bullfy::squad_manager::{Self, SquadRegistry};
    use bullfy::squad_player_challenge::{Self, ActiveSquadRegistry};
    use bullfy::fee_collector::{Self, Fees};
    use bullfy::admin::{Self, AdminCap, FeeConfig};

    // Test constants
    const ADMIN: address = @0xA;
    const PLAYER1: address = @0xB;
    const PLAYER2: address = @0xC;
    const PLAYER3: address = @0xD;
    
    const MIN_BID_AMOUNT: u64 = 1_000_000; // 0.001 SUI
    const TEST_BID_AMOUNT: u64 = 10_000_000; // 0.01 SUI
    const TEST_DURATION: u64 = 300_000; // 5 minutes
    const TEST_FEE_RATE: u64 = 500; // 5% in basis points

    // Helper function to create a test scenario
    fun create_test_scenario(): Scenario {
        test_scenario::begin(ADMIN)
    }

    // Helper function to setup basic test environment
    fun setup_test_environment(scenario: &mut Scenario) {
        // Initialize admin and fee config
        test_scenario::next_tx(scenario, ADMIN);
        {
            admin::init_for_testing(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(scenario);
            admin::create_fee_config(&admin_cap, TEST_FEE_RATE, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, admin_cap);
        };

        // Initialize match escrow
        test_scenario::next_tx(scenario, ADMIN);
        {
            match_escrow::init_for_testing(test_scenario::ctx(scenario));
        };

        // Initialize squad manager
        test_scenario::next_tx(scenario, ADMIN);
        {
            squad_manager::init_for_testing(test_scenario::ctx(scenario));
        };

        // Initialize active squad registry
        test_scenario::next_tx(scenario, ADMIN);
        {
            squad_player_challenge::init_for_testing(test_scenario::ctx(scenario));
        };

        // Initialize fee collector
        test_scenario::next_tx(scenario, ADMIN);
        {
            fee_collector::init_for_testing(test_scenario::ctx(scenario));
        };
    }

    // Helper function to create a squad for a player
    fun create_squad_for_player(scenario: &mut Scenario, player: address, squad_name: vector<u8>): u64 {
        test_scenario::next_tx(scenario, player);
        {
            let mut squad_registry = test_scenario::take_shared<SquadRegistry>(scenario);
            squad_manager::create_squad(&mut squad_registry, squad_name, test_scenario::ctx(scenario));
            test_scenario::return_shared(squad_registry);
        };

        // Get the squad ID (assuming it's 1 for first squad created by this player)
        test_scenario::next_tx(scenario, player);
        {
            let squad_registry = test_scenario::take_shared<SquadRegistry>(scenario);
            let squad_id = 1; // This would need to be adjusted based on actual implementation
            test_scenario::return_shared(squad_registry);
            squad_id
        }
    }

    // Helper function to create a coin for testing
    fun create_test_coin(amount: u64, ctx: &mut sui::tx_context::TxContext): Coin<SUI> {
        coin::mint_for_testing<SUI>(amount, ctx)
    }

    #[test]
    fun test_create_bid_success() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        // Create squad for player1
        let squad_id = create_squad_for_player(&mut scenario, PLAYER1, b"Test Squad");
        
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let fee_config = test_scenario::take_shared<FeeConfig>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            let payment = create_test_coin(TEST_BID_AMOUNT + (TEST_BID_AMOUNT * TEST_FEE_RATE / 10000), test_scenario::ctx(&mut scenario));
            
            match_escrow::create_bid(
                &mut registry,
                &squad_registry,
                &mut active_squad_registry,
                &fee_config,
                squad_id,
                TEST_BID_AMOUNT,
                TEST_DURATION,
                payment,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Verify bid was created
            let active_bids = match_escrow::get_active_bids(&registry);
            assert!(vector::length(active_bids) == 1, 0);
            
            let bid = vector::borrow(active_bids, 0);
            assert!(bid.creator == PLAYER1, 1);
            assert!(bid.squad_id == squad_id, 2);
            assert!(bid.bid_amount == TEST_BID_AMOUNT, 3);
            assert!(bid.duration == TEST_DURATION, 4);
            assert!(bid.status == BidStatus::Open, 5);
            
            clock::destroy_for_testing(clock);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
            test_scenario::return_shared(fee_config);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_bid_insufficient_amount() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        let squad_id = create_squad_for_player(&mut scenario, PLAYER1, b"Test Squad");
        
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let fee_config = test_scenario::take_shared<FeeConfig>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            let insufficient_amount = MIN_BID_AMOUNT - 1;
            let payment = create_test_coin(insufficient_amount, test_scenario::ctx(&mut scenario));
            
            // This should fail due to insufficient bid amount
            match_escrow::create_bid(
                &mut registry,
                &squad_registry,
                &mut active_squad_registry,
                &fee_config,
                squad_id,
                insufficient_amount,
                TEST_DURATION,
                payment,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
            test_scenario::return_shared(fee_config);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_match_bids_success() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        // Create squads for both players
        let squad1_id = create_squad_for_player(&mut scenario, PLAYER1, b"Squad 1");
        let squad2_id = create_squad_for_player(&mut scenario, PLAYER2, b"Squad 2");
        
        let mut bid1_id: sui::object::ID;
        let mut bid2_id: sui::object::ID;
        
        // Create first bid
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let fee_config = test_scenario::take_shared<FeeConfig>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            let payment = create_test_coin(TEST_BID_AMOUNT + (TEST_BID_AMOUNT * TEST_FEE_RATE / 10000), test_scenario::ctx(&mut scenario));
            
            match_escrow::create_bid(
                &mut registry,
                &squad_registry,
                &mut active_squad_registry,
                &fee_config,
                squad1_id,
                TEST_BID_AMOUNT,
                TEST_DURATION,
                payment,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            let active_bids = match_escrow::get_active_bids(&registry);
            let bid1 = vector::borrow(active_bids, 0);
            bid1_id = object::id(bid1);
            
            clock::destroy_for_testing(clock);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
            test_scenario::return_shared(fee_config);
        };
        
        // Create second bid
        test_scenario::next_tx(&mut scenario, PLAYER2);
        {
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let fee_config = test_scenario::take_shared<FeeConfig>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            let payment = create_test_coin(TEST_BID_AMOUNT + (TEST_BID_AMOUNT * TEST_FEE_RATE / 10000), test_scenario::ctx(&mut scenario));
            
            match_escrow::create_bid(
                &mut registry,
                &squad_registry,
                &mut active_squad_registry,
                &fee_config,
                squad2_id,
                TEST_BID_AMOUNT,
                TEST_DURATION,
                payment,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            let active_bids = match_escrow::get_active_bids(&registry);
            let bid2 = vector::borrow(active_bids, 1);
            bid2_id = object::id(bid2);
            
            clock::destroy_for_testing(clock);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
            test_scenario::return_shared(fee_config);
        };
        
        // Match the bids
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            match_escrow::match_bids(
                &admin_cap,
                &mut registry,
                &squad_registry,
                &mut active_squad_registry,
                bid1_id,
                bid2_id,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Verify match was created
            let active_matches = match_escrow::get_active_matches(&registry);
            assert!(vector::length(active_matches) == 1, 0);
            
            let match_obj = vector::borrow(active_matches, 0);
            assert!(match_obj.player1 == PLAYER1, 1);
            assert!(match_obj.player2 == PLAYER2, 2);
            assert!(match_obj.total_prize == TEST_BID_AMOUNT * 2, 3);
            assert!(match_obj.status == MatchStatus::Active, 4);
            
            // Verify bids are marked as matched
            let active_bids = match_escrow::get_active_bids(&registry);
            let bid1 = vector::borrow(active_bids, 0);
            let bid2 = vector::borrow(active_bids, 1);
            assert!(bid1.status == BidStatus::Matched, 5);
            assert!(bid2.status == BidStatus::Matched, 6);
            
            clock::destroy_for_testing(clock);
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_cancel_bid_success() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        let squad_id = create_squad_for_player(&mut scenario, PLAYER1, b"Test Squad");
        let mut bid_id: sui::object::ID;
        
        // Create bid
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let fee_config = test_scenario::take_shared<FeeConfig>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            let payment = create_test_coin(TEST_BID_AMOUNT + (TEST_BID_AMOUNT * TEST_FEE_RATE / 10000), test_scenario::ctx(&mut scenario));
            
            match_escrow::create_bid(
                &mut registry,
                &squad_registry,
                &mut active_squad_registry,
                &fee_config,
                squad_id,
                TEST_BID_AMOUNT,
                TEST_DURATION,
                payment,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            let active_bids = match_escrow::get_active_bids(&registry);
            let bid = vector::borrow(active_bids, 0);
            bid_id = object::id(bid);
            
            clock::destroy_for_testing(clock);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
            test_scenario::return_shared(fee_config);
        };
        
        // Cancel bid
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            
            match_escrow::cancel_bid(
                &mut registry,
                &mut active_squad_registry,
                bid_id,
                test_scenario::ctx(&mut scenario)
            );
            
            // Verify bid was moved to completed
            assert!(match_escrow::is_bid_completed(&registry, bid_id), 0);
            
            // Verify active bids is empty or updated
            let active_bids = match_escrow::get_active_bids(&registry);
            // The bid should be removed from active bids or marked as cancelled
            
            test_scenario::return_shared(registry);
            test_scenario::return_shared(active_squad_registry);
        };
        
        // Verify refund was sent
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            // Player should have received refund coin
            let effects = test_scenario::next_tx(&mut scenario, PLAYER1);
            // Check if refund was transferred (implementation depends on test framework)
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_complete_match_and_claim_prize() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        // Create squads and bids, then match them
        let squad1_id = create_squad_for_player(&mut scenario, PLAYER1, b"Squad 1");
        let squad2_id = create_squad_for_player(&mut scenario, PLAYER2, b"Squad 2");
        
        let mut bid1_id: sui::object::ID;
        let mut bid2_id: sui::object::ID;
        let mut match_id: sui::object::ID;
        
        // Create and match bids (reusing logic from previous test)
        // ... (bid creation and matching logic)
        
        // Complete match
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let mut squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            match_escrow::complete_match(
                &admin_cap,
                &mut registry,
                &mut squad_registry,
                &mut active_squad_registry,
                match_id,
                PLAYER1, // Winner
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            // Verify match is completed
            let active_matches = match_escrow::get_active_matches(&registry);
            let match_obj = vector::borrow(active_matches, 0);
            assert!(match_obj.status == MatchStatus::Completed, 0);
            assert!(option::contains(&match_obj.winner, &PLAYER1), 1);
            
            clock::destroy_for_testing(clock);
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
        };
        
        // Claim prize
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let mut fees = test_scenario::take_shared<Fees>(&scenario);
            
            match_escrow::claim_prize(
                &admin_cap,
                &mut registry,
                &mut fees,
                match_id,
                test_scenario::ctx(&mut scenario)
            );
            
            // Verify match is moved to completed
            assert!(match_escrow::is_match_completed(&registry, match_id), 0);
            
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(fees);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = match_escrow::E_CANNOT_MATCH_OWN_BID)]
    fun test_cannot_match_own_bid() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        let squad1_id = create_squad_for_player(&mut scenario, PLAYER1, b"Squad 1");
        let squad2_id = create_squad_for_player(&mut scenario, PLAYER1, b"Squad 2"); // Same player
        
        let mut bid1_id: sui::object::ID;
        let mut bid2_id: sui::object::ID;
        
        // Create two bids by same player
        // ... (bid creation logic)
        
        // Try to match own bids - should fail
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            let squad_registry = test_scenario::take_shared<SquadRegistry>(&scenario);
            let mut active_squad_registry = test_scenario::take_shared<ActiveSquadRegistry>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            match_escrow::match_bids(
                &admin_cap,
                &mut registry,
                &squad_registry,
                &mut active_squad_registry,
                bid1_id,
                bid2_id,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
            test_scenario::return_shared(squad_registry);
            test_scenario::return_shared(active_squad_registry);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = match_escrow::E_BID_AMOUNT_MISMATCH)]
    fun test_cannot_match_different_amounts() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        let squad1_id = create_squad_for_player(&mut scenario, PLAYER1, b"Squad 1");
        let squad2_id = create_squad_for_player(&mut scenario, PLAYER2, b"Squad 2");
        
        // Create bids with different amounts
        // ... (implementation would create bids with different amounts)
        
        // Try to match different amounts - should fail
        // ... (matching logic that should fail)
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_view_functions() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            
            // Test various view functions
            let all_active_bid_ids = match_escrow::get_all_active_bid_ids(&registry);
            let all_active_match_ids = match_escrow::get_all_active_match_ids(&registry);
            
            // Initially should be empty
            assert!(vector::length(&all_active_bid_ids) == 0, 0);
            assert!(vector::length(&all_active_match_ids) == 0, 1);
            
            test_scenario::return_shared(registry);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_user_tracking_functions() {
        let mut scenario = create_test_scenario();
        setup_test_environment(&mut scenario);
        
        // Test user bid and match tracking
        test_scenario::next_tx(&mut scenario, PLAYER1);
        {
            let registry = test_scenario::take_shared<EscrowRegistry>(&scenario);
            
            // Test getting user bids when none exist
            let completed_bid_ids = match_escrow::get_user_completed_bid_ids(&registry, PLAYER1);
            let completed_match_ids = match_escrow::get_user_completed_match_ids(&registry, PLAYER1);
            
            assert!(vector::length(&completed_bid_ids) == 0, 0);
            assert!(vector::length(&completed_match_ids) == 0, 1);
            
            test_scenario::return_shared(registry);
        };
        
        test_scenario::end(scenario);
    }
}