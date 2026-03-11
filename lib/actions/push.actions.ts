'use server';

import { and, eq } from 'drizzle-orm';

import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';

export async function subscribePush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const user = await getAuthenticatedUser();

  const [existing] = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);

  if (existing) return { success: true };

  await db.insert(pushSubscriptions).values({
    userId: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.p256dh,
    auth: subscription.auth,
  });

  return { success: true };
}

export async function unsubscribePush(endpoint: string) {
  const user = await getAuthenticatedUser();

  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint)));

  return { success: true };
}
