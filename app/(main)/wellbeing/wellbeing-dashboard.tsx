'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Clock, Coffee, Eye, EyeOff, Moon, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIncognitoStore } from '@/stores/incognito.store';
import { useWellbeingStore } from '@/stores/wellbeing.store';
import { useZenModeStore } from '@/stores/zen-mode.store';

interface WellbeingDashboardProps {
  dailyLimitMinutes: number | null;
  breakReminderMinutes: number | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="text-primary size-4" />
      </div>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        {subtext && <p className="text-muted-foreground text-xs">{subtext}</p>}
      </div>
    </div>
  );
}

export function WellbeingDashboard({
  dailyLimitMinutes,
  breakReminderMinutes,
  quietHoursStart,
  quietHoursEnd,
}: WellbeingDashboardProps) {
  const todayMinutes = useWellbeingStore((s) => s.todayMinutes);
  const sessionStartedAt = useWellbeingStore((s) => s.sessionStartedAt);
  const zenMode = useZenModeStore((s) => s.enabled);
  const zenToggle = useZenModeStore((s) => s.toggle);
  const incognito = useIncognitoStore((s) => s.enabled);
  const incognitoToggle = useIncognitoStore((s) => s.toggle);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const sessionMinutes = sessionStartedAt ? (now - sessionStartedAt) / 60000 : 0;
  const totalToday = todayMinutes + sessionMinutes;
  const limitPercent = dailyLimitMinutes
    ? Math.min(100, (totalToday / dailyLimitMinutes) * 100)
    : 0;

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="size-4" />
          Today&apos;s Usage
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            icon={Clock}
            label="Time on Haven today"
            value={formatMinutes(totalToday)}
            subtext={
              dailyLimitMinutes
                ? `${formatMinutes(dailyLimitMinutes)} daily limit`
                : 'No daily limit set'
            }
          />
          <StatCard
            icon={Coffee}
            label="Current session"
            value={formatMinutes(sessionMinutes)}
            subtext={
              breakReminderMinutes
                ? `Break every ${breakReminderMinutes}m`
                : 'No break reminder set'
            }
          />
        </div>

        {dailyLimitMinutes && (
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Usage</span>
              <span>{Math.round(limitPercent)}%</span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  limitPercent < 60
                    ? 'bg-green-500'
                    : limitPercent < 85
                      ? 'bg-amber-500'
                      : 'bg-red-500',
                )}
                style={{ width: `${limitPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="size-4" />
          Quick Toggles
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={zenToggle}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
              zenMode && 'border-primary bg-primary/5',
            )}
          >
            <Eye className={cn('size-5', zenMode ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <p className="text-sm font-medium">Zen Mode</p>
              <p className="text-muted-foreground text-xs">
                {zenMode ? 'Active — metrics hidden' : 'Hide all vanity metrics'}
              </p>
            </div>
          </button>

          <button
            onClick={incognitoToggle}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
              incognito && 'border-primary bg-primary/5',
            )}
          >
            <EyeOff
              className={cn('size-5', incognito ? 'text-primary' : 'text-muted-foreground')}
            />
            <div>
              <p className="text-sm font-medium">Incognito</p>
              <p className="text-muted-foreground text-xs">
                {incognito ? 'Active — browsing privately' : 'Browse without leaving traces'}
              </p>
            </div>
          </button>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Moon className="size-4" />
          Quiet Hours
        </h2>

        {quietHoursStart && quietHoursEnd ? (
          <div className="flex items-center gap-2 rounded-lg border p-4">
            <Moon className="text-muted-foreground size-5" />
            <div>
              <p className="text-sm font-medium">
                {quietHoursStart} — {quietHoursEnd}
              </p>
              <p className="text-muted-foreground text-xs">
                Notifications muted during this window
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border p-4 text-center">
            <p className="text-muted-foreground text-sm">No quiet hours configured</p>
            <Button variant="link" size="sm" className="mt-1" asChild>
              <Link href="/settings">Set up in Settings</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
