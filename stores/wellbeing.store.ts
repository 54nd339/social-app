import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TickResult {
  shouldBreak: boolean;
  totalMinutes: number;
}

interface WellbeingState {
  sessionStartedAt: number | null;
  todayMinutes: number;
  todayDate: string;
  lastBreakAt: number | null;
  limitReached: boolean;
  startSession: () => void;
  tick: (
    dailyLimitMinutes: number | null,
    breakReminderMinutes: number | null,
  ) => TickResult | undefined;
  resetDay: () => void;
  dismissLimit: () => void;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useWellbeingStore = create<WellbeingState>()(
  persist(
    (set, get) => ({
      sessionStartedAt: null,
      todayMinutes: 0,
      todayDate: getTodayKey(),
      lastBreakAt: null,
      limitReached: false,

      startSession: () => {
        const state = get();
        const today = getTodayKey();
        if (state.todayDate !== today) {
          set({ todayMinutes: 0, todayDate: today, limitReached: false });
        }
        set({ sessionStartedAt: Date.now(), lastBreakAt: Date.now() });
      },

      tick: (dailyLimitMinutes, breakReminderMinutes) => {
        const state = get();
        const today = getTodayKey();

        if (state.todayDate !== today) {
          set({ todayMinutes: 0, todayDate: today, limitReached: false });
        }

        if (!state.sessionStartedAt) return;

        const elapsed = (Date.now() - state.sessionStartedAt) / 60000;
        const total = state.todayMinutes + elapsed;

        if (dailyLimitMinutes && total >= dailyLimitMinutes && !state.limitReached) {
          set({ limitReached: true });
        }

        const shouldBreak = !!(
          breakReminderMinutes &&
          state.lastBreakAt &&
          (Date.now() - state.lastBreakAt) / 60000 >= breakReminderMinutes
        );

        return { shouldBreak, totalMinutes: total };
      },

      resetDay: () =>
        set({
          todayMinutes: 0,
          todayDate: getTodayKey(),
          sessionStartedAt: Date.now(),
          lastBreakAt: Date.now(),
          limitReached: false,
        }),

      dismissLimit: () => set({ limitReached: false }),
    }),
    { name: 'haven-wellbeing' },
  ),
);
