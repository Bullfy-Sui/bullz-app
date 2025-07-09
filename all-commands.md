# Bullfy Smart Contract Commands

## Key Changes in Fee System
- **All fees can now be set to 0** - This includes upfront fees, squad creation fees, squad update fees, and revival fees
- **Squad updates now require a fee payment** - A configurable fee is charged when updating squad name or players
- **Fee validation updated** - Minimum fee requirements removed, all fees can be set to 0 by admin

## Admin Commands

### Create Admin
```bash
sui client call --package $PACKAGE_ID --module admin --function create_admin_cap --args $OWNER_CAP $ADMIN_REGISTRY [admin_address] $CLOCK --gas-budget 100000000
```

### Update Fee Percentage (0-10%, can be 0)
```bash
sui client call --package $PACKAGE_ID --module admin --function update_fee_percentage --args $ADMIN_CAP $FEE_CONFIG [new_fee_bps] --gas-budget 100000000
```
- `new_fee_bps`: 0-1000 basis points (0 = 0%, 500 = 5%, 1000 = 10%)

### Update Squad Creation Fee (0-10 SUI, can be 0)
```bash
sui client call --package $PACKAGE_ID --module admin --function update_squad_creation_fee --args $ADMIN_CAP $FEE_CONFIG [new_fee] --gas-budget 100000000
```
- `new_fee`: 0-10000000000 MIST (0 = free, 1000000000 = 1 SUI)

### Update Squad Update Fee (0-10 SUI, can be 0)
```bash
sui client call --package $PACKAGE_ID --module admin --function update_squad_update_fee --args $ADMIN_CAP $FEE_CONFIG [new_fee] --gas-budget 100000000
```
- `new_fee`: 0-10000000000 MIST (0 = free, 500000000 = 0.5 SUI)

### Update Revival Fees (0-1 SUI each, can be 0)
```bash
sui client call --package $PACKAGE_ID --module admin --function update_revival_fees --args $ADMIN_CAP $FEE_CONFIG [new_standard_fee] [new_instant_fee] --gas-budget 100000000
```
- `new_standard_fee`: 0-1000000000 MIST (0 = free, 50000000 = 0.05 SUI)
- `new_instant_fee`: 0-1000000000 MIST (0 = free, 100000000 = 0.1 SUI)
- Note: If both fees are > 0, instant fee must be higher than standard fee

## Squad Management Commands

### Create Squad
```bash
sui client call --package $PACKAGE_ID --module squad_manager --function create_squad --args $SQUAD_REGISTRY $USER_STATS_REGISTRY $FEE_CONFIG $FEES_OBJECT [payment_coin_object] $CLOCK --gas-budget 100000000
```

### Update Squad (with fee payment)
```bash
sui client call --package $PACKAGE_ID --module squad_manager --function update_squad --args $SQUAD_REGISTRY $FEE_CONFIG $FEES_OBJECT [squad_id] [new_squad_name] '[new_player_names]' [payment_coin_object] --gas-budget 100000000
```
- `squad_id`: Squad ID to update
- `new_squad_name`: New squad name (use `null` to keep unchanged)
- `new_player_names`: JSON array of 7 player names like `'["eth","btc","sol","ada","dot","link","uni"]'` (use `null` to keep unchanged)
- `payment_coin_object`: Coin object to pay the update fee
- **Fee Required**: Must pay the configured squad update fee (can be 0 if admin sets it to 0)

### Update Squad Name Only (with fee payment)
```bash
sui client call --package $PACKAGE_ID --module squad_manager --function update_squad_name --args $SQUAD_REGISTRY $FEE_CONFIG $FEES_OBJECT [squad_id] [new_squad_name] [payment_coin_object] --gas-budget 100000000
```

### Update Squad Players Only (with fee payment)
```bash
sui client call --package $PACKAGE_ID --module squad_manager --function update_squad_players --args $SQUAD_REGISTRY $FEE_CONFIG $FEES_OBJECT [squad_id] '[new_player_names]' [payment_coin_object] --gas-budget 100000000
```

### Add Players to Squad
```bash
sui client call --package $PACKAGE_ID --module squad_manager --function add_players_to_squad --args $SQUAD_REGISTRY [squad_id] [squad_name] [formation] '[player_names]' --gas-budget 100000000
```

## Fee Configuration Examples

### Set All Fees to 0 (Free System)
```bash
# Set upfront fee to 0%
sui client call --package $PACKAGE_ID --module admin --function update_fee_percentage --args $ADMIN_CAP $FEE_CONFIG 0 --gas-budget 100000000

# Set squad creation fee to 0
sui client call --package $PACKAGE_ID --module admin --function update_squad_creation_fee --args $ADMIN_CAP $FEE_CONFIG 0 --gas-budget 100000000

# Set squad update fee to 0
sui client call --package $PACKAGE_ID --module admin --function update_squad_update_fee --args $ADMIN_CAP $FEE_CONFIG 0 --gas-budget 100000000

# Set revival fees to 0
sui client call --package $PACKAGE_ID --module admin --function update_revival_fees --args $ADMIN_CAP $FEE_CONFIG 0 0 --gas-budget 100000000
```

### Set Small Update Fee (0.1 SUI)
```bash
sui client call --package $PACKAGE_ID --module admin --function update_squad_update_fee --args $ADMIN_CAP $FEE_CONFIG 100000000 --gas-budget 100000000
```

## Important Notes

1. **Fee Payments**: Even if fees are set to 0, you still need to provide a payment coin object. If the fee is 0, the full payment will be returned to the sender.

2. **Vector Format**: When providing player names, use JSON array format: `'["player1","player2","player3","player4","player5","player6","player7"]'`

3. **Null Values**: For optional parameters in update commands, use `null` to keep the current value unchanged.

4. **Payment Handling**: If you send more than the required fee, the excess will be returned as change.

5. **Admin Only**: Fee configuration changes can only be made by accounts with admin capabilities. 


