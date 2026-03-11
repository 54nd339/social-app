'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/lib/auth';
import { markNotificationsRead } from '@/lib/db/queries/notification.queries';

export async function markAllNotificationsRead() {
  const user = await getAuthenticatedUser();

  await markNotificationsRead(user.id);
  revalidatePath('/notifications');
  return { success: true };
}

export async function markNotificationRead(notificationId: string) {
  const user = await getAuthenticatedUser();

  await markNotificationsRead(user.id, [notificationId]);
  return { success: true };
}
