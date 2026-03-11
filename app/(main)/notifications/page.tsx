import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';

import { getUserByClerkId } from '@/lib/db/queries/user.queries';

import { NotificationsClient } from './notifications-client';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Your notifications on Haven.',
};

export default async function NotificationsPage() {
  const { userId: clerkId } = await auth();
  const user = clerkId ? await getUserByClerkId(clerkId) : null;

  return <NotificationsClient userId={user?.id} />;
}
