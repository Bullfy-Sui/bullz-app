import { useMemo } from "react";

export type NotificationStatus =
  | "loading"
  | "warning"
  | "success"
  | "error"
  | "info";

type ModalContent = {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
};

// type LoadingContent = {
//   description: string;
//   type: "loading";
// };

interface Args {
  successContent?: ModalContent;
  errorContent?: ModalContent;
  loadingContent?: ModalContent;
  status: NotificationStatus | null;
}

export const useNotificationsModal = (args: Args) => {
  const content = useMemo(() => {
    if (args.status === "success") return args.successContent;
    if (args.status === "loading") return args.loadingContent;
    if (args.status === "error") return args.errorContent;
  }, [args.status]);

  return { ...content, status: args.status };
};
