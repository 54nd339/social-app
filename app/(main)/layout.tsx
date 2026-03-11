import { auth } from '@clerk/nextjs/server';

import { LazyCommandPalette } from '@/components/shared/lazy-command-palette';
import { MobileNav } from '@/components/shared/mobile-nav';
import { Navbar } from '@/components/shared/navbar';
import { PushProvider } from '@/components/shared/push-provider';
import { Sidebar } from '@/components/shared/sidebar';
import { WellbeingTracker } from '@/components/shared/wellbeing-tracker';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth();
  const user = clerkId ? await getUserByClerkId(clerkId) : null;

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>

      <LazyCommandPalette />
      <PushProvider />
      <WellbeingTracker
        dailyLimitMinutes={user?.dailyLimitMinutes ?? null}
        breakReminderMinutes={user?.breakReminderMinutes ?? null}
      />
    </div>
  );
}
