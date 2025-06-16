import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { generateNonce, generateRandomness } from "@mysten/sui/zklogin";

export interface UserKeyData {
  randomness: string;
  nonce: string;
  ephemeralPublicKey: string;
  ephemeralPrivateKey: string;
  maxEpoch: number;
}

export const prepareLoginUrl = () => {
  const FULLNODE_URL = "https://fullnode.testnet.sui.io"; // replace with the RPC URL you want to use
  const suiClient = new SuiClient({ url: FULLNODE_URL });
  suiClient.getLatestSuiSystemState().then((epoch) => {
    const maxEpoch = Number(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const nonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );
    const REDIRECT_URL = "https://2d8c-102-90-101-224.ngrok-free.app";
    // "https://bullfy.vercel.app/";

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.CLIENT_ID}&response_type=id_token&redirect_uri=${REDIRECT_URL}&scope=openid email profile&nonce=${nonce}`;
  });
};
