#!/usr/bin/env node

/**
 * Bullfy Smart Contract Command Generator
 * 
 * This script helps generate CLI commands for interacting with the Bullfy smart contract.
 * It provides proper parameter substitution, validation, and formatting.
 * 
 * Usage:
 *   node command-generator.js [command-type] [options]
 * 
 * Examples:
 *   node command-generator.js create-squad --name "My Squad" --players "player1,player2,player3,player4,player5,player6,player7"
 *   node command-generator.js create-bid --squad-id 1 --amount 100000000 --duration 300000
 *   node command-generator.js match-bids --bid1 "0x123..." --bid2 "0x456..." --prices1 "1000000,2000000,..." --prices2 "1100000,1900000,..."
 */

const fs = require('fs');
const path = require('path');

// Default configuration - update these with your deployed contract addresses
const DEFAULT_CONFIG = {
  BULLFY_PACKAGE: "0x[UPDATE_WITH_DEPLOYED_PACKAGE_ID]",
  ADMIN_CAP: "0x[UPDATE_WITH_ADMIN_CAP_ID]",
  OWNER_CAP: "0x[UPDATE_WITH_OWNER_CAP_ID]",
  ADMIN_REGISTRY: "0x[UPDATE_WITH_ADMIN_REGISTRY_ID]",
  MATCH_SIGNER_CAP: "0x[UPDATE_WITH_MATCH_SIGNER_CAP_ID]",
  SIGNER_REGISTRY: "0x[UPDATE_WITH_SIGNER_REGISTRY_ID]",
  FEES_OBJECT: "0x[UPDATE_WITH_FEES_OBJECT_ID]",
  SQUAD_REGISTRY: "0x[UPDATE_WITH_SQUAD_REGISTRY_ID]",
  FEE_CONFIG: "0x[UPDATE_WITH_FEE_CONFIG_ID]",
  ESCROW_REGISTRY: "0x[UPDATE_WITH_ESCROW_REGISTRY_ID]",
  ACTIVE_SQUAD_REGISTRY: "0x[UPDATE_WITH_ACTIVE_SQUAD_REGISTRY_ID]",
  USER_STATS_REGISTRY: "0x[UPDATE_WITH_USER_STATS_REGISTRY_ID]",
  CLOCK: "0x6"
};

// Command templates
const COMMANDS = {
  // Admin commands
  'create-admin': {
    module: 'admin',
    function: 'create_admin_cap',
    params: ['OWNER_CAP', 'ADMIN_REGISTRY', 'new_admin_address', 'CLOCK'],
    description: 'Create a new admin capability',
    requiredArgs: ['new_admin_address']
  },

  'revoke-admin': {
    module: 'admin',
    function: 'revoke_admin_cap',
    params: ['OWNER_CAP', 'ADMIN_REGISTRY', 'admin_cap_to_revoke', 'CLOCK'],
    description: 'Revoke an admin capability',
    requiredArgs: ['admin_cap_to_revoke']
  },

  'deactivate-admin': {
    module: 'admin',
    function: 'deactivate_admin',
    params: ['ADMIN_CAP', 'CLOCK'],
    description: 'Deactivate admin (self)',
    requiredArgs: []
  },

  'reactivate-admin': {
    module: 'admin',
    function: 'reactivate_admin',
    params: ['ADMIN_CAP', 'CLOCK'],
    description: 'Reactivate admin (self)',
    requiredArgs: []
  },

  'transfer-owner': {
    module: 'admin',
    function: 'transfer_owner_cap',
    params: ['OWNER_CAP', 'new_owner_address'],
    description: 'Transfer owner capability',
    requiredArgs: ['new_owner_address']
  },
  
  'update-fee': {
    module: 'admin',
    function: 'update_fee_percentage',
    params: ['ADMIN_CAP', 'FEE_CONFIG', 'fee_bps', 'CLOCK'],
    description: 'Update fee percentage (0-1000 basis points)',
    requiredArgs: ['fee_bps']
  },

  'update-squad-fee': {
    module: 'admin',
    function: 'update_squad_creation_fee',
    params: ['ADMIN_CAP', 'FEE_CONFIG', 'squad_creation_fee', 'CLOCK'],
    description: 'Update squad creation fee',
    requiredArgs: ['squad_creation_fee']
  },

  'update-revival-fees': {
    module: 'admin',
    function: 'update_revival_fees',
    params: ['ADMIN_CAP', 'FEE_CONFIG', 'standard_fee', 'instant_fee', 'CLOCK'],
    description: 'Update revival fees',
    requiredArgs: ['standard_fee', 'instant_fee']
  },

  // Match signer commands
  'create-match-signer': {
    module: 'match_signer',
    function: 'create_match_signer',
    params: ['ADMIN_CAP', 'SIGNER_REGISTRY', 'backend_service_address', 'CLOCK'],
    description: 'Create a new match signer capability',
    requiredArgs: ['backend_service_address']
  },

  'create-match-signer-owner': {
    module: 'match_signer',
    function: 'create_match_signer_with_owner',
    params: ['OWNER_CAP', 'SIGNER_REGISTRY', 'backend_service_address', 'CLOCK'],
    description: 'Create match signer using owner cap',
    requiredArgs: ['backend_service_address']
  },

  'revoke-match-signer': {
    module: 'match_signer',
    function: 'revoke_match_signer',
    params: ['ADMIN_CAP', 'SIGNER_REGISTRY', 'match_signer_cap_to_revoke', 'CLOCK'],
    description: 'Revoke a match signer capability',
    requiredArgs: ['match_signer_cap_to_revoke']
  },

  'revoke-match-signer-owner': {
    module: 'match_signer',
    function: 'revoke_match_signer_with_owner',
    params: ['OWNER_CAP', 'SIGNER_REGISTRY', 'match_signer_cap_to_revoke', 'CLOCK'],
    description: 'Revoke match signer using owner cap',
    requiredArgs: ['match_signer_cap_to_revoke']
  },

  'deactivate-signer': {
    module: 'match_signer',
    function: 'deactivate_signer',
    params: ['MATCH_SIGNER_CAP', 'CLOCK'],
    description: 'Deactivate signer (self)',
    requiredArgs: []
  },

  'reactivate-signer': {
    module: 'match_signer',
    function: 'reactivate_signer',
    params: ['MATCH_SIGNER_CAP', 'CLOCK'],
    description: 'Reactivate signer (self)',
    requiredArgs: []
  },

  // Squad commands
  'create-squad': {
    module: 'squad_manager',
    function: 'create_squad',
    params: ['SQUAD_REGISTRY', 'USER_STATS_REGISTRY', 'FEE_CONFIG', 'FEES_OBJECT', 'coin_object', 'CLOCK'],
    description: 'Create a new squad',
    requiredArgs: ['coin_object']
  },

  'add-players': {
    module: 'squad_manager', 
    function: 'add_players_to_squad',
    params: ['SQUAD_REGISTRY', 'squad_id', 'squad_name', 'formation', 'players_vector'],
    description: 'Add 7 players to a squad',
    requiredArgs: ['squad_id', 'squad_name', 'formation', 'players'],
    transform: {
      players_vector: (args) => `'[${args.players.split(',').map(p => `"${p.trim()}"`).join(',')}]'`
    }
  },

  'revive-squad': {
    module: 'squad_manager',
    function: 'revive_squad',
    params: ['SQUAD_REGISTRY', 'USER_STATS_REGISTRY', 'FEE_CONFIG', 'FEES_OBJECT', 'squad_id', 'coin_object', 'CLOCK'],
    description: 'Revive squad (automatically determines standard/instant based on wait time)',
    requiredArgs: ['squad_id', 'coin_object']
  },

  // Match escrow commands
  'create-bid': {
    module: 'match_escrow',
    function: 'create_bid',
    params: ['ESCROW_REGISTRY', 'SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'FEE_CONFIG', 'squad_id', 'bid_amount', 'duration', 'coin_object', 'CLOCK'],
    description: 'Create a bid for 1v1 match',
    requiredArgs: ['squad_id', 'bid_amount', 'duration', 'coin_object']
  },

  'match-bids': {
    module: 'match_escrow',
    function: 'match_bids',
    params: ['MATCH_SIGNER_CAP', 'ESCROW_REGISTRY', 'SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'bid1_id', 'bid2_id', 'squad1_prices', 'squad2_prices', 'CLOCK'],
    description: 'Match two bids together',
    requiredArgs: ['bid1_id', 'bid2_id', 'prices1', 'prices2'],
    transform: {
      squad1_prices: (args) => `'[${args.prices1}]'`,
      squad2_prices: (args) => `'[${args.prices2}]'`
    }
  },

  'cancel-bid': {
    module: 'match_escrow',
    function: 'cancel_bid',
    params: ['ESCROW_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'bid_id'],
    description: 'Cancel a bid',
    requiredArgs: ['bid_id']
  },

  'complete-match': {
    module: 'match_escrow',
    function: 'complete_match',
    params: ['MATCH_SIGNER_CAP', 'ESCROW_REGISTRY', 'SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'USER_STATS_REGISTRY', 'match_id', 'squad1_final_prices_vector', 'squad2_final_prices_vector', 'CLOCK'],
    description: 'Complete a match with final token prices (determines winner/loser/tie automatically)',
    requiredArgs: ['match_id', 'squad1_final_prices', 'squad2_final_prices'],
    transform: {
      squad1_final_prices_vector: (args) => `'[${args['squad1_final_prices'].split(',').join(',')}]'`,
      squad2_final_prices_vector: (args) => `'[${args['squad2_final_prices'].split(',').join(',')}]'`
    }
  },

  'claim-prize': {
    module: 'match_escrow',
    function: 'claim_prize',
    params: ['MATCH_SIGNER_CAP', 'ESCROW_REGISTRY', 'FEES_OBJECT', 'match_id'],
    description: 'Claim prize from completed match',
    requiredArgs: ['match_id']
  },

  // Challenge commands
  'create-challenge': {
    module: 'squad_player_challenge',
    function: 'create_challenge',
    params: ['SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'FEE_CONFIG', 'squad_id', 'entry_fee', 'max_participants', 'scheduled_start_time', 'duration', 'coin_object', 'CLOCK'],
    description: 'Create a new challenge/tournament',
    requiredArgs: ['squad_id', 'entry_fee', 'max_participants', 'scheduled_start_time', 'duration', 'coin_object']
  },

  'join-challenge': {
    module: 'squad_player_challenge',
    function: 'join_challenge',
    params: ['SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'FEE_CONFIG', 'challenge_object', 'squad_id', 'coin_object', 'CLOCK'],
    description: 'Join an existing challenge',
    requiredArgs: ['challenge_object', 'squad_id', 'coin_object']
  },

  'start-challenge': {
    module: 'squad_player_challenge',
    function: 'start_challenge',
    params: ['MATCH_SIGNER_CAP', 'challenge_object', 'initial_prices', 'CLOCK'],
    description: 'Start a challenge with initial token prices',
    requiredArgs: ['challenge_object', 'initial_prices'],
    transform: {
      initial_prices: (args) => `'[${args.initial_prices.split(';').map(prices => `"[${prices}]"`).join(', ')}]'`
    }
  },

  'complete-challenge': {
    module: 'squad_player_challenge',
    function: 'complete_challenge',
    params: ['MATCH_SIGNER_CAP', 'SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'USER_STATS_REGISTRY', 'FEES_OBJECT', 'challenge_object', 'final_prices', 'CLOCK'],
    description: 'Complete a challenge with final token prices',
    requiredArgs: ['challenge_object', 'final_prices'],
    transform: {
      final_prices: (args) => `'[${args.final_prices.split(';').map(prices => `"[${prices}]"`).join(', ')}]'`
    }
  },

  'cancel-challenge': {
    module: 'squad_player_challenge',
    function: 'cancel_challenge',
    params: ['SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'FEES_OBJECT', 'challenge_object', 'CLOCK'],
    description: 'Cancel a challenge (before it starts)',
    requiredArgs: ['challenge_object']
  },

  'expire-challenge': {
    module: 'squad_player_challenge',
    function: 'expire_challenge',
    params: ['SQUAD_REGISTRY', 'ACTIVE_SQUAD_REGISTRY', 'FEES_OBJECT', 'challenge_object', 'CLOCK'],
    description: 'Expire a challenge (insufficient participants)',
    requiredArgs: ['challenge_object']
  },

  // Fee collector commands
  'withdraw-fees': {
    module: 'fee_collector',
    function: 'withdraw',
    params: ['ADMIN_CAP', 'FEES_OBJECT', 'amount'],
    description: 'Withdraw specific amount from fees',
    requiredArgs: ['amount']
  },

  'withdraw-all-fees': {
    module: 'fee_collector',
    function: 'withdraw_all',
    params: ['ADMIN_CAP', 'FEES_OBJECT'],
    description: 'Withdraw all fees',
    requiredArgs: []
  }
};

// Helper functions
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...DEFAULT_CONFIG, ...userConfig };
    } catch (error) {
      console.warn('Warning: Could not parse config.json, using defaults');
    }
  }
  return DEFAULT_CONFIG;
}

function generateCommand(commandType, args, config) {
  const command = COMMANDS[commandType];
  if (!command) {
    throw new Error(`Unknown command type: ${commandType}`);
  }

  // Special handling for add-players command - provide default formation if missing
  if (commandType === 'add-players' && !args.formation) {
    args.formation = '4-3-3'; // Default formation
  }

  // Validate required arguments
  for (const requiredArg of command.requiredArgs) {
    if (!args[requiredArg]) {
      throw new Error(`Missing required argument: ${requiredArg}`);
    }
  }

  // Build parameters array
  const params = command.params.map(param => {
    // Handle config values (uppercase)
    if (config[param]) {
      return config[param];
    }

    // Handle transformations
    if (command.transform && command.transform[param]) {
      return command.transform[param](args);
    }

    // Handle direct argument mapping
    const argValue = args[param.replace(/_/g, '-')] || args[param];
    if (argValue !== undefined) {
      // Quote string values that contain spaces to prevent argument parsing issues
      if (typeof argValue === 'string' && argValue.includes(' ') && !argValue.startsWith('"')) {
        return `"${argValue}"`;
      }
      return argValue;
    }

    throw new Error(`Cannot resolve parameter: ${param}`);
  });

  // Generate the command
  const cmdParts = [
    'sui client call',
    `--package ${config.BULLFY_PACKAGE}`,
    `--module ${command.module}`,
    `--function ${command.function}`,
    `--args ${params.join(' ')}`,
    '--gas-budget 100000000'
  ];

  return cmdParts.join(' \\\n  ');
}

function generatePTB(commands, config) {
  const moves = commands.map(({ commandType, args }) => {
    const command = COMMANDS[commandType];
    if (!command) {
      throw new Error(`Unknown command type: ${commandType}`);
    }

    const params = command.params.map(param => {
      if (config[param]) {
        return `@${config[param]}`;
      }
      if (command.transform && command.transform[param]) {
        return command.transform[param](args);
      }
      const argValue = args[param.replace(/_/g, '-')] || args[param];
      if (argValue !== undefined) {
        // Quote string values that contain spaces to prevent argument parsing issues
        if (typeof argValue === 'string' && argValue.includes(' ') && !argValue.startsWith('"')) {
          return `"${argValue}"`;
        }
        return argValue;
      }
      throw new Error(`Cannot resolve parameter: ${param}`);
    });

    return `--move-call ${config.BULLFY_PACKAGE}::${command.module}::${command.function} ${params.join(' ')}`;
  });

  return [
    'sui client ptb',
    '--gas-budget 200000000',
    ...moves
  ].join(' \\\n  ');
}

function showHelp() {
  console.log(`
Bullfy Smart Contract Command Generator

USAGE:
  node command-generator.js <command> [options]
  node command-generator.js ptb <command1> [options1] <command2> [options2] ...
  node command-generator.js config <key> <value>
  node command-generator.js list

COMMANDS:
${Object.entries(COMMANDS).map(([key, cmd]) => 
  `  ${key.padEnd(25)} ${cmd.description}`
).join('\n')}

COMMON OPTIONS:
  --squad-id <id>                 Squad ID number
  --bid-amount <amount>           Bid amount in MIST
  --duration <ms>                 Duration in milliseconds  
  --coin-object <id>              Sui coin object ID
  --match-id <id>                 Match object ID
  --challenge-object <id>         Challenge object ID
  --bid-id <id>                   Bid object ID
  --prices1 <prices>              Comma-separated token prices for squad 1
  --prices2 <prices>              Comma-separated token prices for squad 2
  --players <names>               Comma-separated player names (exactly 7)
  --formation <formation>         Squad formation (e.g., "4-3-3", "3-5-2", defaults to "4-3-3")
  --amount <amount>               Amount in MIST
  --fee-bps <bps>                 Fee in basis points (0-1000)
  --new-admin-address <address>   Address for new admin
  --backend-service-address <addr> Backend service address for match signer

EXAMPLES:
  # Admin operations
  node command-generator.js create-admin --new-admin-address 0x123...
  node command-generator.js update-fee --fee-bps 300
  node command-generator.js withdraw-fees --amount 1000000000

  # Match signer operations  
  node command-generator.js create-match-signer --backend-service-address 0x456...
  node command-generator.js deactivate-signer

  # Squad operations
  node command-generator.js create-squad --coin-object 0x123...
  node command-generator.js add-players --squad-id 1 --squad-name "Warriors" --formation "4-3-3" --players "eth,btc,sol,ada,dot,link,uni"
  node command-generator.js add-players --squad-id 2 --squad-name "Titans" --players "matic,avax,atom,algo,near,ftm,icp"  # formation defaults to "4-3-3"
  node command-generator.js revive-squad --squad-id 1 --coin-object 0x789...

  # Bidding and matching
  node command-generator.js create-bid --squad-id 1 --bid-amount 100000000 --duration 300000 --coin-object 0x456...
  node command-generator.js match-bids --bid1-id 0x789... --bid2-id 0xabc... --prices1 "1000000,2000000,1500000,3000000,2500000,1800000,2200000" --prices2 "1100000,1900000,1600000,2900000,2400000,1700000,2100000"
  node command-generator.js cancel-bid --bid-id 0x123...

  # Challenge operations
  node command-generator.js create-challenge --squad-id 1 --entry-fee 1000000000 --max-participants 4 --scheduled-start-time 1774518152000 --duration 3600000 --coin-object 0xdef...
  node command-generator.js join-challenge --challenge-object 0x123... --squad-id 2 --coin-object 0x456...
  node command-generator.js cancel-challenge --challenge-object 0x789...

  # Programmable Transaction Blocks (PTB)
  node command-generator.js ptb create-squad --coin-object 0x123... add-players --squad-id 2 --squad-name "Warriors" --players "eth,btc,sol,ada,dot,link,uni"
  node command-generator.js ptb complete-match --match-id 0x123... --final-prices1 "1050000,2100000,..." --final-prices2 "1150000,1950000,..." claim-prize --match-id 0x123...

  # Configuration management
  node command-generator.js config BULLFY_PACKAGE 0x1234567890abcdef...
  node command-generator.js config ADMIN_CAP 0xabcdef1234567890...

CONFIG:
  Configuration is stored in config.json. Use 'config' command to update values.
  Default values are used if config.json doesn't exist.

TOKEN PRICE FORMAT:
  Token prices should be comma-separated values for exactly 7 players.
  For challenges with multiple squads, separate each squad's prices with semicolons.
  Example: "1000000,2000000,1500000,3000000,2500000,1800000,2200000;1100000,1900000,1600000,2900000,2400000,1700000,2100000"
`);
}

function listCommands() {
  console.log('\nAvailable Commands:\n');
  Object.entries(COMMANDS).forEach(([key, cmd]) => {
    console.log(`${key}:`);
    console.log(`  Description: ${cmd.description}`);
    console.log(`  Module: ${cmd.module}.${cmd.function}`);
    console.log(`  Required args: ${cmd.requiredArgs.join(', ')}`);
    console.log('');
  });
}

function updateConfig(key, value) {
  const configPath = path.join(__dirname, 'config.json');
  let config = DEFAULT_CONFIG;
  
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.warn('Warning: Could not parse existing config.json');
    }
  }

  config[key] = value;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Updated ${key} = ${value}`);
}

// Parse command line arguments
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].substring(2).replace(/-/g, '_');
      args[key] = argv[i + 1];
    }
  }
  return args;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  if (args[0] === 'list') {
    listCommands();
    return;
  }

  if (args[0] === 'config') {
    if (args.length !== 3) {
      console.error('Usage: node command-generator.js config <key> <value>');
      process.exit(1);
    }
    updateConfig(args[1], args[2]);
    return;
  }

  const config = loadConfig();

  if (args[0] === 'ptb') {
    // Handle Programmable Transaction Block with multiple commands
    const commands = [];
    let i = 1;
    while (i < args.length) {
      const commandType = args[i++];
      const commandArgs = {};
      
      while (i < args.length && args[i].startsWith('--')) {
        const key = args[i++].substring(2).replace(/-/g, '_');
        const value = args[i++];
        commandArgs[key] = value;
      }
      
      commands.push({ commandType, args: commandArgs });
    }
    
    try {
      const ptbCommand = generatePTB(commands, config);
      console.log(ptbCommand);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
    return;
  }

  // Handle single command
  const commandType = args[0];
  const commandArgs = parseArgs(args.slice(1));

  try {
    const command = generateCommand(commandType, commandArgs, config);
    console.log(command);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateCommand,
  generatePTB,
  COMMANDS,
  DEFAULT_CONFIG
}; 