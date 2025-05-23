import { useMemo } from "react";

type ModalContent = {
  title: string;
  description: string;
  buttonLabel: string;
  type: "success" | "error";
  onButtonClick: () => void;
};

type LoadingContent = {
  description: string;
  type: "loading";
};

interface Args {
  //   dependencies: boolean[];
  successContent?: ModalContent;
  errorContent?: ModalContent;
  loadingContent: LoadingContent;
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
}

export const useNotificationsModal = (args: Args) => {
  return useMemo(() => {
    if (args.isSuccess) return args.successContent;
    if (args.isLoading) return args.loadingContent;
    if (args.isError) return args.errorContent;
  }, [args.isError, args.isSuccess, args.isLoading]);
};
