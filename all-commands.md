# Bullfy Smart Contract - Complete Command Reference

This file contains all available commands for interacting with the Bullfy smart contract using the command generator.

## Basic Usage
```bash
# Single command
node command-generator.js <command> [options]

# Programmable Transaction Block (multiple commands)
node command-generator.js ptb <command1> [options1] <command2> [options2] ...

# Configuration management
node command-generator.js config <key> <value>

# List all commands
node command-generator.js list
```

## 🔧 Configuration Commands

### Update Configuration
```bash
# Update package ID
node command-generator.js config BULLFY_PACKAGE 0xa2934c685c047a9b9b85511c5796f1c0bd17090f5047f64a9d8172baad534482

# Update owner capability
node command-generator.js config OWNER_CAP 0x575493d87be077d3c84af2e1160926d5d036ef7134f8d6e58f7a69472981bf15

# Update admin capability (after creating one)
node command-generator.js config ADMIN_CAP 0xYOUR_ADMIN_CAP_ID

# Update match signer capability (after creating one)
node command-generator.js config MATCH_SIGNER_CAP 0xYOUR_MATCH_SIGNER_CAP_ID
```

## 👑 Admin Commands

### Create Admin Capability
```bash
# Create a new admin capability
node command-generator.js create-admin --new-admin-address 0xd2b523dbf9612d35159d62a0a49a74f63b4e20b1a99fe8316838ac87289b8846
```

### Revoke Admin Capability
```bash
# Revoke an admin capability
node command-generator.js revoke-admin --admin-cap-to-revoke 0xADMIN_CAP_ID_TO_REVOKE
```

### Admin Status Management
```bash
# Deactivate admin (self)
node command-generator.js deactivate-admin

# Reactivate admin (self)
node command-generator.js reactivate-admin
```

### Transfer Ownership
```bash
# Transfer owner capability to new address
node command-generator.js transfer-owner --new-owner-address 0xNEW_OWNER_ADDRESS
```

### Fee Management
```bash
# Update fee percentage (0-1000 basis points, e.g., 300 = 3%)
node command-generator.js update-fee --fee-bps 300

# Update squad creation fee (in MIST)
node command-generator.js update-squad-fee --squad-creation-fee 1000000000

# Update revival fees (standard and instant in MIST)
node command-generator.js update-revival-fees --standard-fee 500000000 --instant-fee 2000000000
```

### Fee Collection
```bash
# Withdraw collected fees
node command-generator.js withdraw-fees --amount 1000000000
```

## 🔐 Match Signer Commands

### Create Match Signer Capability
```bash
# Create match signer using admin capability
node command-generator.js create-match-signer --backend-service-address 0xBACKEND_SERVICE_ADDRESS

# Create match signer using owner capability
node command-generator.js create-match-signer-owner --backend-service-address 0xBACKEND_SERVICE_ADDRESS
```

### Revoke Match Signer Capability
```bash
# Revoke match signer using admin capability
node command-generator.js revoke-match-signer --match-signer-cap-to-revoke 0xSIGNER_CAP_ID

# Revoke match signer using owner capability
node command-generator.js revoke-match-signer-owner --match-signer-cap-to-revoke 0xSIGNER_CAP_ID
```

### Signer Status Management
```bash
# Deactivate signer (self)
node command-generator.js deactivate-signer

# Reactivate signer (self)
node command-generator.js reactivate-signer
```

## 👥 Squad Management Commands

### Create Squad
```bash
# Create a new squad (requires coin object for fee payment)
node command-generator.js create-squad --coin-object 0xYOUR_COIN_OBJECT_ID
```

### Add Players to Squad
```bash
# Add exactly 7 players to a squad (with formation)
node command-generator.js add-players --squad-id 1 --squad-name "Warriors" --formation "4-3-3" --players "eth,btc,sol,ada,dot,link,uni"

# Alternative crypto players with different formation
node command-generator.js add-players --squad-id 2 --squad-name "Team Beta" --formation "3-5-2" --players "matic,avax,atom,algo,near,ftm,icp"

# Generated command will format players as JSON array:
# --args SQUAD_REGISTRY 1 Warriors 4-3-3 '["eth","btc","sol","ada","dot","link","uni"]'
# ✅ This format works correctly with Sui CLI
```

### Squad Revival
```bash
# Revive squad (automatically determines standard/instant based on wait time)
node command-generator.js revive-squad --squad-id 1 --coin-object 0xYOUR_COIN_OBJECT_ID
```

### Delete Squad
```bash
# Delete a squad (only squad owner can delete)
# Note: Ensure squad is not active in matches/challenges before deletion
node command-generator.js delete-squad --squad-id 1
```

**Important**: Before deleting a squad, you should verify it's not currently active in any matches or challenges. You can check this by:
1. Querying the `ActiveSquadRegistry` object to see if the squad ID exists in active squads
2. Using the `is_squad_active` function from the `squad_player_challenge` module

Manual command:
```bash
# Delete a squad (only squad owner can delete)
sui client call \
  --package $BULLFY_PACKAGE \
  --module squad_manager \
  --function delete_squad \
  --args $SQUAD_REGISTRY 1 $CLOCK \
  --gas-budget 100000000
```

### Check Squad Active Status
```bash
# Check if a squad is currently active in matches/challenges
node command-generator.js check-squad-active --squad-id 1
```

Manual command:
```bash
# Check if a squad is currently active in matches/challenges
sui client call \
  --package $BULLFY_PACKAGE \
  --module squad_player_challenge \
  --function is_squad_active \
  --args $ACTIVE_SQUAD_REGISTRY 1 \
  --gas-budget 100000000
```

## 💰 Bidding & Matching Commands

### Create Bid
```bash
# Create a bid for a squad (amount in MIST, duration in milliseconds)
node command-generator.js create-bid --squad-id 1 --bid-amount 100000000 --duration 300000 --coin-object 0xYOUR_COIN_OBJECT_ID

# Create higher stakes bid
node command-generator.js create-bid --squad-id 2 --bid-amount 1000000000 --duration 600000 --coin-object 0xYOUR_COIN_OBJECT_ID
```

### Cancel Bid
```bash
# Cancel an active bid
node command-generator.js cancel-bid --bid-id 0xYOUR_BID_OBJECT_ID
```

### Match Bids
```bash
# Match two bids with current token prices (7 prices for each squad)
node command-generator.js match-bids --bid1-id 0xBID1_OBJECT_ID --bid2-id 0xBID2_OBJECT_ID --prices1 "1000000,2000000,1500000,3000000,2500000,1800000,2200000" --prices2 "1100000,1900000,1600000,2900000,2400000,1700000,2100000"

# Generated format: '[1000000,2000000,1500000,3000000,2500000,1800000,2200000]' '[1100000,1900000,1600000,2900000,2400000,1700000,2100000]'
# ✅ JSON array format works correctly with Sui CLI
```

## 🏆 Match Management Commands

### Complete Match
```bash
# Complete a match with final token prices
node command-generator.js complete-match --match-id 0xMATCH_OBJECT_ID --final-prices1 "1050000,2100000,1550000,3100000,2600000,1850000,2250000" --final-prices2 "1150000,1950000,1650000,2950000,2450000,1750000,2150000"

# Generated format: '[1050000,2100000,1550000,3100000,2600000,1850000,2250000]' '[1150000,1950000,1650000,2950000,2450000,1750000,2150000]'
# ✅ JSON array format works correctly with Sui CLI
```

### Cancel Match
```bash
# Cancel an active match
node command-generator.js cancel-match --match-id 0xMATCH_OBJECT_ID
```

### Claim Prize
```bash
# Claim prize from a completed match
node command-generator.js claim-prize --match-id 0xMATCH_OBJECT_ID
```

## 🎯 Challenge Commands

### Create Challenge
```bash
# Create a squad challenge (scheduled start time in milliseconds since epoch)
node command-generator.js create-challenge --squad-id 1 --entry-fee 1000000000 --max-participants 4 --scheduled-start-time 1774518152000 --duration 3600000 --coin-object 0xYOUR_COIN_OBJECT_ID

# Create smaller challenge
node command-generator.js create-challenge --squad-id 2 --entry-fee 100000000 --max-participants 2 --scheduled-start-time 1774521752000 --duration 1800000 --coin-object 0xYOUR_COIN_OBJECT_ID
```

### Join Challenge
```bash
# Join an existing challenge
node command-generator.js join-challenge --challenge-object 0xCHALLENGE_OBJECT_ID --squad-id 2 --coin-object 0xYOUR_COIN_OBJECT_ID
```

### Start Challenge
```bash
# Start a challenge with initial token prices for all squads
node command-generator.js start-challenge --challenge-object 0xCHALLENGE_OBJECT_ID --initial-prices "1000000,2000000,1500000,3000000,2500000,1800000,2200000;1100000,1900000,1600000,2900000,2400000,1700000,2100000"

# Generated format for multiple squads: '["[1000000,2000000,1500000,3000000,2500000,1800000,2200000]", "[1100000,1900000,1600000,2900000,2400000,1700000,2100000]"]'
# ✅ Nested JSON array format works correctly with Sui CLI
```

### Complete Challenge
```bash
# Complete a challenge with final token prices for all squads
node command-generator.js complete-challenge --challenge-object 0xCHALLENGE_OBJECT_ID --final-prices "1050000,2100000,1550000,3100000,2600000,1850000,2250000;1150000,1950000,1650000,2950000,2450000,1750000,2150000"

# Generated format for multiple squads: '["[1050000,2100000,1550000,3100000,2600000,1850000,2250000]", "[1150000,1950000,1650000,2950000,2450000,1750000,2150000]"]'
# ✅ Nested JSON array format works correctly with Sui CLI
```

### Cancel Challenge
```bash
# Cancel a challenge
node command-generator.js cancel-challenge --challenge-object 0xCHALLENGE_OBJECT_ID
```

### Claim Challenge Prize
```bash
# Claim prize from a completed challenge
node command-generator.js claim-challenge-prize --challenge-object 0xCHALLENGE_OBJECT_ID
```

## 📊 Query Commands

### Check Squad Info
```bash
# Get squad information
sui client object 0xSQUAD_OBJECT_ID --json
```

### Check Bid Info
```bash
# Get bid information
sui client object 0xBID_OBJECT_ID --json
```

### Check Match Info
```bash
# Get match information
sui client object 0xMATCH_OBJECT_ID --json
```

### Check Challenge Info
```bash
# Get challenge information
sui client object 0xCHALLENGE_OBJECT_ID --json
```

### List Your Objects
```bash
# List all objects owned by your address
sui client objects

# List objects with specific type
sui client objects --filter StructType --struct-type 0xa2934c685c047a9b9b85511c5796f1c0bd17090f5047f64a9d8172baad534482::squad_manager::Squad
```

## 🔄 Programmable Transaction Blocks (PTB)

### Create Squad and Add Players
```bash
# Create squad and add players in one transaction
node command-generator.js ptb create-squad --coin-object 0xYOUR_COIN_OBJECT_ID add-players --squad-id 1 --squad-name "Warriors" --formation "4-3-3" --players "eth,btc,sol,ada,dot,link,uni"
```

### Create Bid and Match
```bash
# Create two bids and match them
node command-generator.js ptb create-bid --squad-id 1 --bid-amount 100000000 --duration 300000 --coin-object 0xCOIN1 create-bid --squad-id 2 --bid-amount 100000000 --duration 300000 --coin-object 0xCOIN2
```

### Complete Match and Claim Prize
```bash
# Complete match and claim prize in one transaction
node command-generator.js ptb complete-match --match-id 0xMATCH_ID --final-prices1 "1050000,2100000,1550000,3100000,2600000,1850000,2250000" --final-prices2 "1150000,1950000,1650000,2950000,2450000,1750000,2150000" claim-prize --match-id 0xMATCH_ID
```

## 📝 Examples by Use Case

### Setup New Deployment
```bash
# 1. Create admin capability
node command-generator.js create-admin --new-admin-address 0xYOUR_ADMIN_ADDRESS

# 2. Update config with admin cap
node command-generator.js config ADMIN_CAP 0xNEW_ADMIN_CAP_ID

# 3. Create match signer capability
node command-generator.js create-match-signer --backend-service-address 0xYOUR_BACKEND_ADDRESS

# 4. Update config with match signer cap
node command-generator.js config MATCH_SIGNER_CAP 0xNEW_MATCH_SIGNER_CAP_ID
```

### Basic Gaming Flow
```bash
# 1. Create two squads
node command-generator.js create-squad --coin-object 0xCOIN1
node command-generator.js create-squad --coin-object 0xCOIN2

# 2. Add players to squads
node command-generator.js add-players --squad-id 1 --squad-name "Team Alpha" --formation "4-3-3" --players "eth,btc,sol,ada,dot,link,uni"
node command-generator.js add-players --squad-id 2 --squad-name "Team Beta" --formation "3-5-2" --players "matic,avax,atom,algo,near,ftm,icp"

# 3. Create bids
node command-generator.js create-bid --squad-id 1 --bid-amount 100000000 --duration 300000 --coin-object 0xCOIN3
node command-generator.js create-bid --squad-id 2 --bid-amount 100000000 --duration 300000 --coin-object 0xCOIN4

# 4. Match bids (requires match signer capability)
node command-generator.js match-bids --bid1-id 0xBID1_ID --bid2-id 0xBID2_ID --prices1 "1000000,2000000,1500000,3000000,2500000,1800000,2200000" --prices2 "1100000,1900000,1600000,2900000,2400000,1700000,2100000"

# 5. Complete match (after some time)
node command-generator.js complete-match --match-id 0xMATCH_ID --final-prices1 "1050000,2100000,1550000,3100000,2600000,1850000,2250000" --final-prices2 "1150000,1950000,1650000,2950000,2450000,1750000,2150000"

# 6. Claim prize
node command-generator.js claim-prize --match-id 0xMATCH_ID
```

### Challenge Tournament
```bash
# 1. Create challenge
node command-generator.js create-challenge --squad-id 1 --entry-fee 1000000000 --max-participants 4 --scheduled-start-time 1774518152000 --duration 3600000 --coin-object 0xCOIN1

# 2. Other players join
node command-generator.js join-challenge --challenge-object 0xCHALLENGE_ID --squad-id 2 --coin-object 0xCOIN2
node command-generator.js join-challenge --challenge-object 0xCHALLENGE_ID --squad-id 3 --coin-object 0xCOIN3
node command-generator.js join-challenge --challenge-object 0xCHALLENGE_ID --squad-id 4 --coin-object 0xCOIN4

# 3. Start challenge (requires match signer capability)
node command-generator.js start-challenge --challenge-object 0xCHALLENGE_ID --prices "1000000,2000000,1500000,3000000,2500000,1800000,2200000;1100000,1900000,1600000,2900000,2400000,1700000,2100000;1050000,2050000,1550000,3050000,2550000,1850000,2250000;1080000,1980000,1580000,2980000,2480000,1780000,2180000"

# 4. Complete challenge
node command-generator.js complete-challenge --challenge-object 0xCHALLENGE_ID --final-prices "1050000,2100000,1550000,3100000,2600000,1850000,2250000;1150000,1950000,1650000,2950000,2450000,1750000,2150000;1070000,2070000,1570000,3070000,2570000,1870000,2270000;1090000,1990000,1590000,2990000,2490000,1790000,2190000"

# 5. Winners claim prizes
node command-generator.js claim-challenge-prize --challenge-object 0xCHALLENGE_ID
```

## 🚨 Important Notes

### Token Prices Format
- Always provide exactly 7 prices for each squad
- Prices should be comma-separated without spaces
- For multiple squads (challenges), separate each squad's prices with semicolons
- **Single squad example**: `"1000000,2000000,1500000,3000000,2500000,1800000,2200000"`
- **Multiple squads example**: `"1000000,2000000,1500000,3000000,2500000,1800000,2200000;1100000,1900000,1600000,2900000,2400000,1700000,2100000"`

### Generated Vector Formats
- **Single vectors**: `'[1000000,2000000,1500000,3000000,2500000,1800000,2200000]'` ✅
- **Multiple squad vectors**: `'["[1000000,2000000,...]", "[1100000,1900000,...]"]'` ✅
- **Players vector**: `'["eth","btc","sol","ada","dot","link","uni"]'` ✅

### Common Player Names
```
Popular crypto tokens: eth,btc,sol,ada,dot,link,uni,matic,avax,atom,algo,near,ftm,icp,xrp,ltc,bch,xlm,vet,theta,fil,aave,mkr,comp,snx,uma,crv,yfi,sushi,1inch,ens,grt,lrc,bal,knc,zrx,bat,ren,storj,ant,mana,sand,axs,shib,doge,etc,eos,trx,neo,ont,qtum,icx,zil,rvn,dgb,sc,dcr,zen,dash,xmr,zec,lsk,ark,nano,iota,miota,ada,xlm,xem,waves,strat,pivx,via,vtc,blk,bay,sys,nxt,burst,gbyte,smart,kmd,fair,game,dyn,seq,part,xzc,crown,rdd,pot,pink,ok,nxs,sib,emc,ion,nlg,qrk,ftc,ppc,nvc,xpm,aur,mona,via,vtc,blk,bay,sys,nxt,burst,gbyte,smart,kmd,fair,game,dyn,seq,part,xzc,crown,rdd,pot,pink,ok,nxs,sib,emc,ion,nlg,qrk,ftc,ppc,nvc,xpm,aur,mona
```

### Gas Budget
- Most commands use `--gas-budget 100000000` (0.1 SUI)
- PTB commands use `--gas-budget 200000000` (0.2 SUI)
- Adjust gas budget if transactions fail due to insufficient gas

### Getting Coin Objects
```bash
# Get your coin objects
sui client gas

# Use specific coin object
sui client object 0xYOUR_COIN_OBJECT_ID --json
```

This command reference covers all functionality available in the Bullfy smart contract. Always ensure you have the required capabilities and coin objects before executing commands. 


