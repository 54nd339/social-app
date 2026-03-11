'use client';

import { useTransition } from 'react';
import { Clock, Coffee, Moon } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { updateWellbeingSettings } from '@/lib/actions/settings.actions';
import type { WellbeingSettingsInput } from '@/lib/validators/settings';

interface WellbeingSettingsProps {
  initialData: WellbeingSettingsInput;
}

export function WellbeingSettings({ initialData }: WellbeingSettingsProps) {
  const [isPending, startTransition] = useTransition();

  function handleSave(updates: Partial<WellbeingSettingsInput>) {
    const newData = { ...initialData, ...updates };
    startTransition(async () => {
      try {
        await updateWellbeingSettings(newData);
        toast.success('Settings updated');
      } catch {
        toast.error('Failed to update settings');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Digital Wellbeing</h2>
        <p className="text-muted-foreground text-sm">Set healthy boundaries for your social time</p>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Clock className="text-muted-foreground mt-0.5 size-5" />
          <div className="flex-1 space-y-2">
            <Label>Daily time limit (minutes)</Label>
            <p className="text-muted-foreground text-xs">Get reminded when you exceed your limit</p>
            <Input
              type="number"
              min={0}
              max={1440}
              defaultValue={initialData.dailyLimitMinutes ?? ''}
              placeholder="No limit"
              disabled={isPending}
              onBlur={(e) => {
                const v = e.target.value ? parseInt(e.target.value) : null;
                handleSave({ dailyLimitMinutes: v });
              }}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Coffee className="text-muted-foreground mt-0.5 size-5" />
          <div className="flex-1 space-y-2">
            <Label>Break reminder (minutes)</Label>
            <p className="text-muted-foreground text-xs">
              Remind you to take breaks after continuous usage
            </p>
            <Input
              type="number"
              min={0}
              max={480}
              defaultValue={initialData.breakReminderMinutes ?? ''}
              placeholder="No reminder"
              disabled={isPending}
              onBlur={(e) => {
                const v = e.target.value ? parseInt(e.target.value) : null;
                handleSave({ breakReminderMinutes: v });
              }}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Moon className="text-muted-foreground mt-0.5 size-5" />
          <div className="flex-1 space-y-2">
            <Label>Quiet hours</Label>
            <p className="text-muted-foreground text-xs">Mute notifications during these hours</p>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                defaultValue={initialData.quietHoursStart ?? ''}
                placeholder="Start"
                disabled={isPending}
                onBlur={(e) => handleSave({ quietHoursStart: e.target.value || null })}
                className="w-32"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="time"
                defaultValue={initialData.quietHoursEnd ?? ''}
                placeholder="End"
                disabled={isPending}
                onBlur={(e) => handleSave({ quietHoursEnd: e.target.value || null })}
                className="w-32"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
