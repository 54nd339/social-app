import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import {
  PrivacySettings,
  ProfileSettings,
  ThemeSettings,
  WellbeingSettings,
} from '@/components/settings';
import { Separator } from '@/components/ui/separator';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export default async function SettingsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return notFound();

  const user = await getUserByClerkId(clerkId);
  if (!user) return notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="space-y-8 p-4">
        <ProfileSettings
          initialData={{
            displayName: user.displayName,
            bio: user.bio,
            location: user.location,
            website: user.website,
            statusText: user.statusText,
            statusEmoji: user.statusEmoji,
          }}
        />

        <Separator />

        <ThemeSettings />

        <Separator />

        <PrivacySettings
          initialData={{
            isPrivate: user.isPrivate,
            profileViewsEnabled: user.profileViewsEnabled,
          }}
        />

        <Separator />

        <WellbeingSettings
          initialData={{
            dailyLimitMinutes: user.dailyLimitMinutes,
            breakReminderMinutes: user.breakReminderMinutes,
            quietHoursStart: user.quietHoursStart,
            quietHoursEnd: user.quietHoursEnd,
          }}
        />
      </div>
    </div>
  );
}
