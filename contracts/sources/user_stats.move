module bullfy::user_stats {
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // Error constants
    const EUserNotFound: u64 = 5001;
   

    // User statistics struct
    public struct UserStats has key, store {
        id: UID,
        user_address: address,
        // Match statistics
        total_matches: u64,
        total_wins: u64,
        total_losses: u64,
        // Financial statistics  
        total_prizes_won: u64,
        total_amount_wagered: u64,
        biggest_win: u64,
        // Streak tracking
        current_win_streak: u64,
        longest_win_streak: u64,
        current_loss_streak: u64,
        // Squad statistics
        total_squads_created: u64,
        squads_revived: u64,
        // Performance metrics
        average_match_duration: u64,
        total_match_time: u64,
        // Timestamps
        first_match_time: u64,
        last_match_time: u64,
        last_updated: u64,
    }

    // Global leaderboard registry
    public struct UserStatsRegistry has key {
        id: UID,
        user_stats: Table<address, UserStats>,
        // Global leaderboard data
        total_users: u64,
        total_matches_played: u64,
        total_prizes_distributed: u64,
        // Top performers (cached for efficiency)
        top_winners: vector<address>,        // Top 10 by wins
        top_earners: vector<address>,        // Top 10 by prizes
        top_win_rates: vector<address>,      // Top 10 by win rate (min 10 matches)
        most_active: vector<address>,        // Top 10 by total matches
        longest_streaks: vector<address>,    // Top 10 by longest win streak
        // Update tracking
        last_leaderboard_update: u64,
        leaderboard_update_threshold: u64,   // Update every N new matches
    }

    // Events
    public struct UserStatsCreated has copy, drop {
        user_address: address,
        created_at: u64,
    }

    public struct UserStatsUpdated has copy, drop {
        user_address: address,
        match_type: String,  // "1v1_match" or "challenge"
        is_winner: bool,
        prize_amount: u64,
        new_total_wins: u64,
        new_total_matches: u64,
        new_win_streak: u64,
        updated_at: u64,
    }

    public struct SquadStatsUpdated has copy, drop {
        user_address: address,
        squad_created: bool,
        squad_revived: bool,
        new_total_squads: u64,
        new_revivals: u64,
        updated_at: u64,
    }

    public struct LeaderboardUpdated has copy, drop {
        total_users: u64,
        total_matches: u64,
        top_winner: address,
        top_earner: address,
        updated_at: u64,
    }

    public struct NewRecord has copy, drop {
        user_address: address,
        record_type: String,  // "biggest_win", "longest_streak", etc.
        old_value: u64,
        new_value: u64,
        achieved_at: u64,
    }

    // Initialize the user stats registry
    fun init(ctx: &mut TxContext) {
        let registry = UserStatsRegistry {
            id: object::new(ctx),
            user_stats: table::new(ctx),
            total_users: 0,
            total_matches_played: 0,
            total_prizes_distributed: 0,
            top_winners: vector::empty<address>(),
            top_earners: vector::empty<address>(),
            top_win_rates: vector::empty<address>(),
            most_active: vector::empty<address>(),
            longest_streaks: vector::empty<address>(),
            last_leaderboard_update: 0,
            leaderboard_update_threshold: 100, // Update leaderboards every 100 matches
        };
        transfer::share_object(registry);
    }

    // Create initial stats for a new user
    public fun create_user_stats(
        registry: &mut UserStatsRegistry,
        user_address: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        if (table::contains(&registry.user_stats, user_address)) {
            return // User already exists
        };

        let current_time = clock::timestamp_ms(clock);
        let user_stats = UserStats {
            id: object::new(ctx),
            user_address,
            total_matches: 0,
            total_wins: 0,
            total_losses: 0,
            total_prizes_won: 0,
            total_amount_wagered: 0,
            biggest_win: 0,
            current_win_streak: 0,
            longest_win_streak: 0,
            current_loss_streak: 0,
            total_squads_created: 0,
            squads_revived: 0,
            average_match_duration: 0,
            total_match_time: 0,
            first_match_time: 0,
            last_match_time: 0,
            last_updated: current_time,
        };

        table::add(&mut registry.user_stats, user_address, user_stats);
        registry.total_users = registry.total_users + 1;

        event::emit(UserStatsCreated {
            user_address,
            created_at: current_time,
        });
    }

    // Update user stats after a match completion
    public fun update_match_stats(
        registry: &mut UserStatsRegistry,
        user_address: address,
        is_winner: bool,
        prize_amount: u64,
        wager_amount: u64,
        match_duration: u64,
        match_type: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Create user stats if not exists
        if (!table::contains(&registry.user_stats, user_address)) {
            create_user_stats(registry, user_address, clock, ctx);
        };

        let user_stats = table::borrow_mut(&mut registry.user_stats, user_address);
        
        // Update basic match stats
        user_stats.total_matches = user_stats.total_matches + 1;
        user_stats.total_amount_wagered = user_stats.total_amount_wagered + wager_amount;
        user_stats.last_match_time = current_time;
        
        // Set first match time if this is the first match
        if (user_stats.first_match_time == 0) {
            user_stats.first_match_time = current_time;
        };

        // Update match duration stats
        user_stats.total_match_time = user_stats.total_match_time + match_duration;
        user_stats.average_match_duration = user_stats.total_match_time / user_stats.total_matches;

        let old_win_streak = user_stats.current_win_streak;
        let old_biggest_win = user_stats.biggest_win;

        if (is_winner) {
            // Winner updates
            user_stats.total_wins = user_stats.total_wins + 1;
            user_stats.total_prizes_won = user_stats.total_prizes_won + prize_amount;
            user_stats.current_win_streak = user_stats.current_win_streak + 1;
            user_stats.current_loss_streak = 0;
            
            // Check for new records
            if (user_stats.current_win_streak > user_stats.longest_win_streak) {
                user_stats.longest_win_streak = user_stats.current_win_streak;
                
                event::emit(NewRecord {
                    user_address,
                    record_type: string::utf8(b"longest_streak"),
                    old_value: old_win_streak,
                    new_value: user_stats.longest_win_streak,
                    achieved_at: current_time,
                });
            };

            if (prize_amount > user_stats.biggest_win) {
                user_stats.biggest_win = prize_amount;
                
                event::emit(NewRecord {
                    user_address,
                    record_type: string::utf8(b"biggest_win"),
                    old_value: old_biggest_win,
                    new_value: prize_amount,
                    achieved_at: current_time,
                });
            };
        } else {
            // Loser updates
            user_stats.total_losses = user_stats.total_losses + 1;
            user_stats.current_win_streak = 0;
            user_stats.current_loss_streak = user_stats.current_loss_streak + 1;
        };

        user_stats.last_updated = current_time;
        registry.total_matches_played = registry.total_matches_played + 1;
        registry.total_prizes_distributed = registry.total_prizes_distributed + prize_amount;

        // Capture values before dropping the borrow
        let total_wins = user_stats.total_wins;
        let total_prizes_won = user_stats.total_prizes_won;
        let total_matches = user_stats.total_matches;
        let longest_win_streak = user_stats.longest_win_streak;
        let current_win_streak = user_stats.current_win_streak;

        // Emit update event
        event::emit(UserStatsUpdated {
            user_address,
            match_type,
            is_winner,
            prize_amount,
            new_total_wins: total_wins,
            new_total_matches: total_matches,
            new_win_streak: current_win_streak,
            updated_at: current_time,
        });

        // Update this specific user's position in leaderboards immediately
        update_user_in_top_winners(registry, user_address, total_wins);
        update_user_in_top_earners(registry, user_address, total_prizes_won);
        update_user_in_most_active(registry, user_address, total_matches);
        update_user_in_longest_streaks(registry, user_address, longest_win_streak);
        
        // Update leaderboard timestamp
        registry.last_leaderboard_update = current_time;

        // Emit leaderboard update event with current top performers
        let top_winner = if (vector::length(&registry.top_winners) > 0) {
            *vector::borrow(&registry.top_winners, 0)
        } else {
            @0x0
        };
        
        let top_earner = if (vector::length(&registry.top_earners) > 0) {
            *vector::borrow(&registry.top_earners, 0)
        } else {
            @0x0
        };

        event::emit(LeaderboardUpdated {
            total_users: registry.total_users,
            total_matches: registry.total_matches_played,
            top_winner,
            top_earner,
            updated_at: current_time,
        });
    }

    // Update squad-related stats
    public fun update_squad_stats(
        registry: &mut UserStatsRegistry,
        user_address: address,
        squad_created: bool,
        squad_revived: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Create user stats if not exists
        if (!table::contains(&registry.user_stats, user_address)) {
            create_user_stats(registry, user_address, clock, ctx);
        };

        let user_stats = table::borrow_mut(&mut registry.user_stats, user_address);
        
        if (squad_created) {
            user_stats.total_squads_created = user_stats.total_squads_created + 1;
        };
        
        if (squad_revived) {
            user_stats.squads_revived = user_stats.squads_revived + 1;
        };

        user_stats.last_updated = current_time;

        event::emit(SquadStatsUpdated {
            user_address,
            squad_created,
            squad_revived,
            new_total_squads: user_stats.total_squads_created,
            new_revivals: user_stats.squads_revived,
            updated_at: current_time,
        });
    }

    // Function to add/update a user in the top winners leaderboard
    fun update_user_in_top_winners(registry: &mut UserStatsRegistry, user_address: address, wins: u64) {
        let top_winners = &mut registry.top_winners;
        let max_leaderboard_size = 10;
        
        // Remove user if they're already in the leaderboard
        let mut i = 0;
        while (i < vector::length(top_winners)) {
            if (*vector::borrow(top_winners, i) == user_address) {
                vector::remove(top_winners, i);
                break
            };
            i = i + 1;
        };
        
        // Find correct position to insert based on wins (descending order)
        let mut insert_position = vector::length(top_winners);
        i = 0;
        while (i < vector::length(top_winners)) {
            let current_user = *vector::borrow(top_winners, i);
            let current_user_stats = table::borrow(&registry.user_stats, current_user);
            if (wins > current_user_stats.total_wins) {
                insert_position = i;
                break
            };
            i = i + 1;
        };
        
        // Insert user at correct position if they qualify for top 10
        if (insert_position < max_leaderboard_size) {
            vector::insert(top_winners, user_address, insert_position);
            
            // Remove excess users if we exceed max size
            while (vector::length(top_winners) > max_leaderboard_size) {
                vector::pop_back(top_winners);
            };
        };
    }

    // Function to add/update a user in the top earners leaderboard
    fun update_user_in_top_earners(registry: &mut UserStatsRegistry, user_address: address, prizes: u64) {
        let top_earners = &mut registry.top_earners;
        let max_leaderboard_size = 10;
        
        // Remove user if they're already in the leaderboard
        let mut i = 0;
        while (i < vector::length(top_earners)) {
            if (*vector::borrow(top_earners, i) == user_address) {
                vector::remove(top_earners, i);
                break
            };
            i = i + 1;
        };
        
        // Find correct position to insert based on prizes (descending order)
        let mut insert_position = vector::length(top_earners);
        i = 0;
        while (i < vector::length(top_earners)) {
            let current_user = *vector::borrow(top_earners, i);
            let current_user_stats = table::borrow(&registry.user_stats, current_user);
            if (prizes > current_user_stats.total_prizes_won) {
                insert_position = i;
                break
            };
            i = i + 1;
        };
        
        // Insert user at correct position if they qualify for top 10
        if (insert_position < max_leaderboard_size) {
            vector::insert(top_earners, user_address, insert_position);
            
            // Remove excess users if we exceed max size
            while (vector::length(top_earners) > max_leaderboard_size) {
                vector::pop_back(top_earners);
            };
        };
    }

    // Function to add/update a user in the most active leaderboard
    fun update_user_in_most_active(registry: &mut UserStatsRegistry, user_address: address, matches: u64) {
        let most_active = &mut registry.most_active;
        let max_leaderboard_size = 10;
        
        // Remove user if they're already in the leaderboard
        let mut i = 0;
        while (i < vector::length(most_active)) {
            if (*vector::borrow(most_active, i) == user_address) {
                vector::remove(most_active, i);
                break
            };
            i = i + 1;
        };
        
        // Find correct position to insert based on matches (descending order)
        let mut insert_position = vector::length(most_active);
        i = 0;
        while (i < vector::length(most_active)) {
            let current_user = *vector::borrow(most_active, i);
            let current_user_stats = table::borrow(&registry.user_stats, current_user);
            if (matches > current_user_stats.total_matches) {
                insert_position = i;
                break
            };
            i = i + 1;
        };
        
        // Insert user at correct position if they qualify for top 10
        if (insert_position < max_leaderboard_size) {
            vector::insert(most_active, user_address, insert_position);
            
            // Remove excess users if we exceed max size
            while (vector::length(most_active) > max_leaderboard_size) {
                vector::pop_back(most_active);
            };
        };
    }

    // Function to add/update a user in the longest streaks leaderboard
    fun update_user_in_longest_streaks(registry: &mut UserStatsRegistry, user_address: address, streak: u64) {
        let longest_streaks = &mut registry.longest_streaks;
        let max_leaderboard_size = 10;
        
        // Remove user if they're already in the leaderboard
        let mut i = 0;
        while (i < vector::length(longest_streaks)) {
            if (*vector::borrow(longest_streaks, i) == user_address) {
                vector::remove(longest_streaks, i);
                break
            };
            i = i + 1;
        };
        
        // Find correct position to insert based on streak (descending order)
        let mut insert_position = vector::length(longest_streaks);
        i = 0;
        while (i < vector::length(longest_streaks)) {
            let current_user = *vector::borrow(longest_streaks, i);
            let current_user_stats = table::borrow(&registry.user_stats, current_user);
            if (streak > current_user_stats.longest_win_streak) {
                insert_position = i;
                break
            };
            i = i + 1;
        };
        
        // Insert user at correct position if they qualify for top 10
        if (insert_position < max_leaderboard_size) {
            vector::insert(longest_streaks, user_address, insert_position);
            
            // Remove excess users if we exceed max size
            while (vector::length(longest_streaks) > max_leaderboard_size) {
                vector::pop_back(longest_streaks);
            };
        };
    }

    // View functions
    public fun get_user_stats(registry: &UserStatsRegistry, user_address: address): &UserStats {
        assert!(table::contains(&registry.user_stats, user_address), EUserNotFound);
        table::borrow(&registry.user_stats, user_address)
    }

    public fun user_exists(registry: &UserStatsRegistry, user_address: address): bool {
        table::contains(&registry.user_stats, user_address)
    }

    public fun get_global_stats(registry: &UserStatsRegistry): (u64, u64, u64) {
        (registry.total_users, registry.total_matches_played, registry.total_prizes_distributed)
    }

    public fun get_user_win_rate(registry: &UserStatsRegistry, user_address: address): u64 {
        assert!(table::contains(&registry.user_stats, user_address), EUserNotFound);
        let user_stats = table::borrow(&registry.user_stats, user_address);
        
        if (user_stats.total_matches == 0) {
            return 0
        };
        
        // Return win rate as percentage (0-10000 for 0.00% to 100.00%)
        (user_stats.total_wins * 10000) / user_stats.total_matches
    }

    public fun get_user_profit(registry: &UserStatsRegistry, user_address: address): u64 {
        assert!(table::contains(&registry.user_stats, user_address), EUserNotFound);
        let user_stats = table::borrow(&registry.user_stats, user_address);
        
        if (user_stats.total_prizes_won >= user_stats.total_amount_wagered) {
            user_stats.total_prizes_won - user_stats.total_amount_wagered
        } else {
            0 // No negative values, return 0 for net loss
        }
    }

    public fun is_profitable_user(registry: &UserStatsRegistry, user_address: address): bool {
        assert!(table::contains(&registry.user_stats, user_address), EUserNotFound);
        let user_stats = table::borrow(&registry.user_stats, user_address);
        user_stats.total_prizes_won > user_stats.total_amount_wagered
    }

    // Getters for individual stats
    public fun get_total_matches(user_stats: &UserStats): u64 { user_stats.total_matches }
    public fun get_total_wins(user_stats: &UserStats): u64 { user_stats.total_wins }
    public fun get_total_losses(user_stats: &UserStats): u64 { user_stats.total_losses }
    public fun get_total_prizes_won(user_stats: &UserStats): u64 { user_stats.total_prizes_won }
    public fun get_total_amount_wagered(user_stats: &UserStats): u64 { user_stats.total_amount_wagered }
    public fun get_biggest_win(user_stats: &UserStats): u64 { user_stats.biggest_win }
    public fun get_current_win_streak(user_stats: &UserStats): u64 { user_stats.current_win_streak }
    public fun get_longest_win_streak(user_stats: &UserStats): u64 { user_stats.longest_win_streak }
    public fun get_current_loss_streak(user_stats: &UserStats): u64 { user_stats.current_loss_streak }
    public fun get_total_squads_created(user_stats: &UserStats): u64 { user_stats.total_squads_created }
    public fun get_squads_revived(user_stats: &UserStats): u64 { user_stats.squads_revived }
    public fun get_average_match_duration(user_stats: &UserStats): u64 { user_stats.average_match_duration }
    public fun get_first_match_time(user_stats: &UserStats): u64 { user_stats.first_match_time }
    public fun get_last_match_time(user_stats: &UserStats): u64 { user_stats.last_match_time }
    public fun get_user_address(user_stats: &UserStats): address { user_stats.user_address }

    // Leaderboard getter functions
    public fun get_top_winners(registry: &UserStatsRegistry): &vector<address> {
        &registry.top_winners
    }

    public fun get_top_earners(registry: &UserStatsRegistry): &vector<address> {
        &registry.top_earners
    }

    public fun get_top_win_rates(registry: &UserStatsRegistry): &vector<address> {
        &registry.top_win_rates
    }

    public fun get_most_active(registry: &UserStatsRegistry): &vector<address> {
        &registry.most_active
    }

    public fun get_longest_streaks(registry: &UserStatsRegistry): &vector<address> {
        &registry.longest_streaks
    }

    public fun get_last_leaderboard_update(registry: &UserStatsRegistry): u64 {
        registry.last_leaderboard_update
    }
} 