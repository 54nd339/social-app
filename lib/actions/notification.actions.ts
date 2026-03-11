'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

import { markNotificationsRead } from '@/lib/db/queries/notification.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function markAllNotificationsRead() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  await markNotificationsRead(user.id);
  revalidatePath('/notifications');
  return { success: true };
}

export async function markNotificationRead(notificationId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  await markNotificationsRead(user.id, [notificationId]);
  return { success: true };
}
