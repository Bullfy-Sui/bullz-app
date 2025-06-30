// Package IDs for different networks
export const TESTNET_PACKAGE_ID = "";
export const DEVNET_PACKAGE_ID = "0xaa6aa9532ac41de53e880578837a1dd2906e887d39bb05de75a7e8dfb0ec4287";
export const MAINNET_PACKAGE_ID = "0x0"; // Replace with actual package ID when deploying to mainnet

// Admin capability IDs
export const TESTNET_ADMIN_CAP = "";
export const DEVNET_ADMIN_CAP = "0xd51cbac2d2de7d4beb230e1924e6513e10725e6c1268e48d6f17cd853342f0f3";
export const MAINNET_ADMIN_CAP = "";

// Owner capability IDs
export const TESTNET_OWNER_CAP = "";
export const DEVNET_OWNER_CAP = "0x4ebedb70036e86e10da3227ed7659965a15f77df9f876aa5ef5ab8d7aba7eecb";
export const MAINNET_OWNER_CAP = "";

// Squad Registry IDs
export const TESTNET_SQUAD_REGISTRY = "";
export const DEVNET_SQUAD_REGISTRY = "0x1c6f6f130bc5a1925a3e8acad9ea1b723de4e6e50cf4909f3c79c2eae422b4bd";
export const MAINNET_SQUAD_REGISTRY = "";

// Player Registry IDs
export const TESTNET_PLAYER_REGISTRY = "";
export const DEVNET_PLAYER_REGISTRY = "0xf13a8f35edbd4a9396ecb52a367f2abb8c39b2569a088f88bfbf9b8ab4ff78d1";
export const MAINNET_PLAYER_REGISTRY = "";

// Match Queue IDs
export const TESTNET_MATCH_QUEUE = "";
export const DEVNET_MATCH_QUEUE = "0x6b9208aae667fa00a8e0496fea654ab4fbb0a7d1e15d5d2e61f2fb58e7cb4163";
export const MAINNET_MATCH_QUEUE = "";

// Fees IDs
export const TESTNET_FEES = "";
export const DEVNET_FEES = "0x7cd49a9878747d3a959aac90100d0acbf86a36a9b35a6398d6f4fc229d723573";
export const MAINNET_FEES = "";

// Helper function to get the correct ID based on network
export const getNetworkSpecificId = (network: 'devnet' | 'testnet' | 'mainnet', idType: string) => {
  switch (idType) {
    case 'package':
      return network === 'devnet' 
        ? DEVNET_PACKAGE_ID 
        : network === 'testnet' 
          ? TESTNET_PACKAGE_ID 
          : MAINNET_PACKAGE_ID;
    case 'admin':
      return network === 'devnet' 
        ? DEVNET_ADMIN_CAP 
        : network === 'testnet' 
          ? TESTNET_ADMIN_CAP 
          : MAINNET_ADMIN_CAP;
    case 'owner':
      return network === 'devnet' 
        ? DEVNET_OWNER_CAP 
        : network === 'testnet' 
          ? TESTNET_OWNER_CAP 
          : MAINNET_OWNER_CAP;
    case 'squadRegistry':
      return network === 'devnet' 
        ? DEVNET_SQUAD_REGISTRY 
        : network === 'testnet' 
          ? TESTNET_SQUAD_REGISTRY 
          : MAINNET_SQUAD_REGISTRY;
    case 'playerRegistry':
      return network === 'devnet' 
        ? DEVNET_PLAYER_REGISTRY 
        : network === 'testnet' 
          ? TESTNET_PLAYER_REGISTRY 
          : MAINNET_PLAYER_REGISTRY;
    case 'matchQueue':
      return network === 'devnet' 
        ? DEVNET_MATCH_QUEUE 
        : network === 'testnet' 
          ? TESTNET_MATCH_QUEUE 
          : MAINNET_MATCH_QUEUE;
    case 'fees':
      return network === 'devnet' 
        ? DEVNET_FEES 
        : network === 'testnet' 
          ? TESTNET_FEES 
          : MAINNET_FEES;
    default:
      return '';
  }
}; 