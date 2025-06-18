import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AppStore {
  address: string | null;
  setAddress: (address: string | null) => void;
  // google_id: string | null;
  // setGoogleId: (google_id: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      address:
        "0x9f3b93e6a2ab44b7e8f0a4fba0cbb97bb3a3d38d49cf6f6c6db43a2a93c9f1c1",
      setAddress: (address: string | null) => set(() => ({ address })),
      // google_id: null,
      // setGoogleId: (google_id: string | null) => set(() => ({ google_id })),
    }),
    {
      name: "bullfy-app-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
