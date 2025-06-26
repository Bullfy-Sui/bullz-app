import { BASE_AXIOS, HttpClient } from "@/lib/http";
import { useAppStore } from "@/lib/store/app-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SquadForm } from "../types";
import { SquadResponse } from "./types";
// import { PriceListResponse } from "./types";

export const useCreateSquad = () => {
  const { address } = useAppStore();
  return useMutation({
    mutationKey: ["create-squad"],
    mutationFn: (data: SquadForm) =>
      HttpClient.post(BASE_AXIOS, {
        url: "/squads",
        data: { ...data, wallet_address: address },
      }),
  });
};

export const useGetUserSquads = () => {
  return useQuery({
    queryKey: ["get-user-squads"],
    queryFn: () =>
      HttpClient.get<SquadResponse>(BASE_AXIOS, {
        url: "/squads",
        params: {
          wallet_address: useAppStore.getState().address,
        },
      }),
  });
};
