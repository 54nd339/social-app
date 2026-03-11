'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useWellbeingStore } from '@/stores/wellbeing.store';

interface ScreenTimeConfig {
  dailyLimitMinutes: number | null;
  breakReminderMinutes: number | null;
}

export function useScreenTime(config: ScreenTimeConfig) {
  const startSession = useWellbeingStore((s) => s.startSession);
  const tick = useWellbeingStore((s) => s.tick);
  const breakShownRef = useRef(false);

  useEffect(() => {
    startSession();

    const interval = setInterval(() => {
      const result = tick(config.dailyLimitMinutes, config.breakReminderMinutes);
      if (result?.shouldBreak && !breakShownRef.current) {
        breakShownRef.current = true;
        toast.info('Time for a break! Step away for a few minutes.', {
          duration: 10000,
          action: {
            label: 'Dismiss',
            onClick: () => {
              breakShownRef.current = false;
              useWellbeingStore.setState({ lastBreakAt: Date.now() });
            },
          },
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [startSession, tick, config.dailyLimitMinutes, config.breakReminderMinutes]);
}
