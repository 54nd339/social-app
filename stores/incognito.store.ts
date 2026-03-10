import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IncognitoState {
  enabled: boolean;
  toggle: () => void;
}

export const useIncognitoStore = create<IncognitoState>()(
  persist(
    (set) => ({
      enabled: false,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    { name: 'haven-incognito' },
  ),
);
