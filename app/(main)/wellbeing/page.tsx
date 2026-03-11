import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import { getUserByClerkId } from '@/lib/db/queries/user.queries';

import { WellbeingDashboard } from './wellbeing-dashboard';

export const metadata: Metadata = {
  title: 'Digital Wellbeing',
  description: 'Monitor your screen time and manage your digital habits.',
};

export default async function WellbeingPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return notFound();

  const user = await getUserByClerkId(clerkId);
  if (!user) return notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Digital Wellbeing</h1>
        <p className="text-muted-foreground text-xs">Understand and manage your Haven usage</p>
      </div>

      <WellbeingDashboard
        dailyLimitMinutes={user.dailyLimitMinutes ?? null}
        breakReminderMinutes={user.breakReminderMinutes ?? null}
        quietHoursStart={user.quietHoursStart ?? null}
        quietHoursEnd={user.quietHoursEnd ?? null}
      />
    </div>
  );
}
