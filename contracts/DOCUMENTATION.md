# Interacting with Bullfy Smart Contracts from the Frontend

## 1. Introduction

This document provides guidance on how to interact with the Bullfy smart contracts deployed on the Sui blockchain from a frontend application. The main contracts covered are:

- **Squad Manager (`bullfy.move`)**: Manage squads with create, update, and query functions.
- **Match Escrow (`match_escrow.move`)**: Handle match bids, escrow, and completion with admin controls.
- **Oracle Interface (`oracle_interface.move.txt`)**: Access price feeds from Pyth oracles.

## 2. Prerequisites

- **Sui SDK**: Use the official Sui JavaScript/TypeScript SDK to interact with the blockchain.
- **Wallet**: A Sui-compatible wallet (e.g., Sui Wallet, Martian) connected to your frontend.
- **Network Configuration**: Ensure your frontend is configured to connect to the correct Sui network (Devnet, Testnet, or Mainnet).
- **Familiarity with Move Objects and Coins**: Understanding of Sui objects, coins, and transaction concepts.

## 3. Calling Entry Functions (Transactions)

Entry functions modify blockchain state and require signed transactions.

### Common Steps:

1. **Connect Wallet**: Obtain the user's wallet address and signer.
2. **Prepare Transaction**: Specify the target contract, entry function, and arguments.
3. **Handle Coins**: For functions requiring coins (e.g., fees, bids), prepare and pass the appropriate coin objects.
4. **Sign and Submit**: Use the wallet to sign and submit the transaction.
5. **Wait for Confirmation**: Optionally wait for transaction confirmation.

### Example: Creating a Squad

```typescript
import { JsonRpcProvider, Ed25519Keypair, RawSigner, Coin } from '@mysten/sui.js';

async function createSquad(provider: JsonRpcProvider, signer: RawSigner, registryId: string) {
  const goalkeeper = "GoalkeeperName";
  const defenders = ["Defender1", "Defender2"];
  const midfielders = ["Midfielder1"];
  const forwards = ["Forward1"];

  // Prepare 1 SUI coin for fee
  const feeAmount = 1_000_000_000; // 1 SUI in MIST
  const coins = await provider.getCoins(signer.getAddress());
  const feeCoin = coins.data.find(c => c.balance >= feeAmount);

  if (!feeCoin) throw new Error("Insufficient balance for fee");

  const tx = {
    packageObjectId: "PACKAGE_OBJECT_ID",
    module: "bullfy",
    function: "create_squad",
    typeArguments: [],
    arguments: [
      registryId,
      goalkeeper,
      defenders,
      midfielders,
      forwards,
      feeCoin.coinObjectId,
    ],
    gasBudget: 10000,
  };

  const result = await signer.signAndExecuteTransaction(tx);
  return result;
}
```

### Notes:

- Replace `"PACKAGE_OBJECT_ID"` and `registryId` with actual deployed contract and registry object IDs.
- Use the Sui SDK to fetch coin objects and prepare arguments accordingly.

## 4. Calling View Functions (Queries)

View functions do not modify state and can be called without transactions.

### Example: Get Squad Info

```typescript
async function getSquad(provider: JsonRpcProvider, registryId: string, ownerAddress: string) {
  const result = await provider.callReadOnlyFunction({
    packageObjectId: "PACKAGE_OBJECT_ID",
    module: "bullfy",
    function: "get_squad",
    typeArguments: [],
    arguments: [registryId, ownerAddress],
  });
  return result;
}
```

## 5. Handling Events

Smart contracts emit events on key actions (e.g., SquadCreated, MatchEntered).

- Use Sui SDK or RPC to subscribe to events by package ID or event type.
- Process events to update frontend UI or notify users.

## 6. Example Code Snippets

- Enter a match with a bid (using `match_escrow` contract).
- Retrieve bid or complete match (admin functions).
- Query price feeds via `oracle_interface`.

(Refer to the contract function signatures for argument details.)

## 7. Best Practices and Error Handling

- Always check for sufficient coin balances before sending transactions.
- Handle errors returned by the blockchain gracefully.
- Use gas budget estimates to avoid failed transactions.
- Validate user inputs before calling contract functions.
- Keep user informed of transaction status and confirmations.

## 8. Additional Resources

- [Sui SDK Documentation](https://docs.sui.io/build/sui-sdk)
- [Move Language Documentation](https://move-language.com/)
- [Pyth Oracle Documentation](https://pyth.network/developers/)

---

This documentation provides a foundation for integrating Bullfy smart contracts into your frontend application. Adjust code snippets and configurations according to your deployment environment and frontend framework.
