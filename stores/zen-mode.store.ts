import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ZenModeState {
  enabled: boolean;
  toggle: () => void;
}

export const useZenModeStore = create<ZenModeState>()(
  persist(
    (set) => ({
      enabled: false,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    { name: 'haven-zen-mode' },
  ),
);
