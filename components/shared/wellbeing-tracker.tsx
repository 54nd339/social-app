'use client';

import { Clock, Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useWellbeingStore } from '@/stores/wellbeing.store';
import { useScreenTime } from '@/hooks/use-screen-time';

interface WellbeingTrackerProps {
  dailyLimitMinutes: number | null;
  breakReminderMinutes: number | null;
}

export function WellbeingTracker({
  dailyLimitMinutes,
  breakReminderMinutes,
}: WellbeingTrackerProps) {
  useScreenTime({ dailyLimitMinutes, breakReminderMinutes });
  const limitReached = useWellbeingStore((s) => s.limitReached);
  const dismissLimit = useWellbeingStore((s) => s.dismissLimit);

  if (!limitReached) return null;

  return (
    <div className="bg-background/95 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="mx-4 max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
            <Heart className="text-primary size-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Time to take a break</h2>
          <p className="text-muted-foreground text-sm">
            You&apos;ve reached your daily limit of{' '}
            <span className="text-foreground font-medium">{dailyLimitMinutes} minutes</span>. Haven
            cares about your wellbeing.
          </p>
        </div>

        <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
          <Clock className="size-3" />
          <span>Come back refreshed tomorrow</span>
        </div>

        <Button variant="outline" size="sm" onClick={dismissLimit}>
          Continue anyway
        </Button>
      </div>
    </div>
  );
}
