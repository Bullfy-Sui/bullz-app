// interface DecodedJwt {
//   iss: string;
//   azp: string;
//   aud: string;
//   sub: string;
//   nonce: string;
//   nbf: number;
//   iat: number;
//   exp: number;
//   jti: string;
// }

"use client";

import { useRegister } from "@/app/login/api-services";
import { RegistrationResponse } from "@/app/login/api-services/types";
import { useGetMutationState } from "@/lib/hooks/use-get-mutation-state";
import { useAppStore } from "@/lib/store/app-store";
import { jwtToAddress } from "@mysten/sui/zklogin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// interface DecodedJwt {
//   sub: string;
//   [key: string]: string;
// }

const stringToBigInt = (str: string) => {
  try {
    return BigInt(str);
  } catch {
    return BigInt(0);
  }
};

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { mutate: register, isPending: registering } = useRegister();
  const { setAddress, address } = useAppStore();
  const [idToken, setIdToken] = useState<string | null>(null);
  const router = useRouter();
  const { data: registerResponse } = useGetMutationState<RegistrationResponse>([
    "register",
  ]);

  // Step 1: Extract token from hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("id_token");
    if (!token) return;
    setIdToken(token);

    // const decodedJwt = jwtDecode<DecodedJwt>(token);
    const salt = stringToBigInt("12345");
    const zkLoginUserAddress = jwtToAddress(token, salt.toString());

    setAddress(zkLoginUserAddress);
  }, [setAddress]);

  // Step 2: Trigger registration
  useEffect(() => {
    if (address && idToken) {
      register(
        { address },
        {
          onSuccess: () => {
            router.push("/squad");
          },
          onError: () => {
            // setGoogleId(null);
            setAddress(null);
          },
        }
      );
    }
  }, [address, idToken, register, setAddress]);

  console.log(registerResponse?.data?.address);

  // Step 3: Wait for registration to finish
  if (registering) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted">Authenticating...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;
