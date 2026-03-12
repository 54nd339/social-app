'use client';

import { useTransition } from 'react';
import { Eye, Heart, Lock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { updatePrivacySettings } from '@/lib/actions/settings.actions';

interface PrivacySettingsProps {
  initialData: {
    isPrivate: boolean;
    profileViewsEnabled: boolean;
    showReplies: boolean;
    showReactions: boolean;
  };
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`bg-background pointer-events-none block size-5 rounded-full shadow-lg transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function PrivacySettings({ initialData }: PrivacySettingsProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(
    field: 'isPrivate' | 'profileViewsEnabled' | 'showReplies' | 'showReactions',
    value: boolean,
  ) {
    const newData = { ...initialData, [field]: value };
    startTransition(async () => {
      try {
        await updatePrivacySettings(newData);
        toast.success('Privacy settings updated');
      } catch {
        toast.error('Failed to update settings');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Privacy</h2>
        <p className="text-muted-foreground text-sm">Control who can see your content</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="text-muted-foreground mt-0.5 size-5" />
            <div>
              <Label className="text-sm font-medium">Private account</Label>
              <p className="text-muted-foreground text-xs">
                Only approved followers can see your posts
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={initialData.isPrivate}
            onChange={(v) => handleToggle('isPrivate', v)}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Eye className="text-muted-foreground mt-0.5 size-5" />
            <div>
              <Label className="text-sm font-medium">Profile views</Label>
              <p className="text-muted-foreground text-xs">
                Allow others to see when you view their profile
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={initialData.profileViewsEnabled}
            onChange={(v) => handleToggle('profileViewsEnabled', v)}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="text-muted-foreground mt-0.5 size-5" />
            <div>
              <Label className="text-sm font-medium">Show replies on profile</Label>
              <p className="text-muted-foreground text-xs">
                Let others see your replies on your profile
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={initialData.showReplies}
            onChange={(v) => handleToggle('showReplies', v)}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Heart className="text-muted-foreground mt-0.5 size-5" />
            <div>
              <Label className="text-sm font-medium">Show reactions on profile</Label>
              <p className="text-muted-foreground text-xs">
                Let others see your reactions on your profile
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={initialData.showReactions}
            onChange={(v) => handleToggle('showReactions', v)}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}
