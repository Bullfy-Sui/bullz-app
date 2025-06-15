"use client";

import { useMutationState } from "@tanstack/react-query";

export const useGetMutationState = <T>(key: string[]) => {
  const res = useMutationState({
    filters: { mutationKey: key },
    select: (mutation) => ({
      status: mutation?.state?.status,
      data: mutation?.state?.data as T,
    }),
  });

  return {
    isPending: res[res.length - 1]?.status === "pending",
    isSuccess: res[res.length - 1]?.status === "success",
    isError: res[res.length - 1]?.status === "error",
    data: res[res.length - 1]?.data,
  };
};
