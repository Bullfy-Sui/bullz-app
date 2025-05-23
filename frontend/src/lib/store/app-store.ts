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
      address: null,
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
