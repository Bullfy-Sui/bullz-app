import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_PACKAGE_ID,
  TESTNET_PACKAGE_ID,
  MAINNET_PACKAGE_ID,
  DEVNET_SQUAD_REGISTRY_ID,
  TESTNET_SQUAD_REGISTRY_ID,
  MAINNET_SQUAD_REGISTRY_ID,
  DEVNET_FEE_CONFIG_ID,
  TESTNET_FEE_CONFIG_ID,
  MAINNET_FEE_CONFIG_ID,
  DEVNET_FEES_ID,
  TESTNET_FEES_ID,
  MAINNET_FEES_ID,
} from "./constantsId.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId: DEVNET_PACKAGE_ID,
        squadRegistryId: DEVNET_SQUAD_REGISTRY_ID,
        feeConfigId: DEVNET_FEE_CONFIG_ID,
        feesId: DEVNET_FEES_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: TESTNET_PACKAGE_ID,
        squadRegistryId: TESTNET_SQUAD_REGISTRY_ID,
        feeConfigId: TESTNET_FEE_CONFIG_ID,
        feesId: TESTNET_FEES_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId: MAINNET_PACKAGE_ID,
        squadRegistryId: MAINNET_SQUAD_REGISTRY_ID,
        feeConfigId: MAINNET_FEE_CONFIG_ID,
        feesId: MAINNET_FEES_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
