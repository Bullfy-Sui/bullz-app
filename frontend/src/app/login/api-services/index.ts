import { BASE_AXIOS, HttpClient } from "@/lib/http";
import { useMutation } from "@tanstack/react-query";
import { AuthRequest, RegistrationResponse } from "./types";

export const useRegister = () => {
  return useMutation({
    mutationKey: ["register"],
    mutationFn: async (data: AuthRequest) => {
      console.log(data);
      return await HttpClient.post<RegistrationResponse>(BASE_AXIOS, {
        url: "http://localhost:8082/api/v1/register",
        data,
      });
    },
  });
};
