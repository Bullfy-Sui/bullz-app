import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { CONSTANTS_ID } from "./constantsId";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: CONSTANTS_ID.testnet.packageId,
        ownerCapId: CONSTANTS_ID.testnet.ownerCapId,
        adminRegistryId: CONSTANTS_ID.testnet.adminRegistryId,
        feeConfigId: CONSTANTS_ID.testnet.feeConfigId,
        feesId: CONSTANTS_ID.testnet.feesId,
        squadRegistryId: CONSTANTS_ID.testnet.squadRegistryId,
        activeSquadRegistryId: CONSTANTS_ID.testnet.activeSquadRegistryId,
        escrowRegistryId: CONSTANTS_ID.testnet.escrowRegistryId,
        signerRegistryId: CONSTANTS_ID.testnet.signerRegistryId,
        userStatsRegistryId: CONSTANTS_ID.testnet.userStatsRegistryId,
      },
    },
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId: CONSTANTS_ID.devnet.packageId,
        ownerCapId: CONSTANTS_ID.devnet.ownerCapId,
        adminRegistryId: CONSTANTS_ID.devnet.adminRegistryId,
        feeConfigId: CONSTANTS_ID.devnet.feeConfigId,
        feesId: CONSTANTS_ID.devnet.feesId,
        squadRegistryId: CONSTANTS_ID.devnet.squadRegistryId,
        activeSquadRegistryId: CONSTANTS_ID.devnet.activeSquadRegistryId,
        escrowRegistryId: CONSTANTS_ID.devnet.escrowRegistryId,
        signerRegistryId: CONSTANTS_ID.devnet.signerRegistryId,
        userStatsRegistryId: CONSTANTS_ID.devnet.userStatsRegistryId,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId: CONSTANTS_ID.mainnet.packageId,
        ownerCapId: CONSTANTS_ID.mainnet.ownerCapId,
        adminRegistryId: CONSTANTS_ID.mainnet.adminRegistryId,
        feeConfigId: CONSTANTS_ID.mainnet.feeConfigId,
        feesId: CONSTANTS_ID.mainnet.feesId,
        squadRegistryId: CONSTANTS_ID.mainnet.squadRegistryId,
        activeSquadRegistryId: CONSTANTS_ID.mainnet.activeSquadRegistryId,
        escrowRegistryId: CONSTANTS_ID.mainnet.escrowRegistryId,
        signerRegistryId: CONSTANTS_ID.mainnet.signerRegistryId,
        userStatsRegistryId: CONSTANTS_ID.mainnet.userStatsRegistryId,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
