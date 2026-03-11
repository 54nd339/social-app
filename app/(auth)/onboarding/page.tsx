import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import { getUserByClerkId } from '@/lib/db/queries/user.queries';

import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await getUserByClerkId(clerkId);

  if (user?.onboardingComplete) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-3xl font-bold">Welcome to Haven</h1>
          <p className="text-muted-foreground">Set up your profile to get started</p>
        </div>
        <OnboardingForm defaultUsername={user?.username ?? ''} />
      </div>
    </div>
  );
}
