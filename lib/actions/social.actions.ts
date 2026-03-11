'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

import { createNotification } from '@/lib/actions/notification.helper';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';

export async function followUser(targetUserId: string) {
  const user = await getAuthenticatedUser();
  if (user.id === targetUserId) throw new Error('Cannot follow yourself');

  const [existing] = await db
    .select({ id: follows.id, status: follows.status })
    .from(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)))
    .limit(1);

  if (existing) {
    throw new Error('Already following or request pending');
  }

  const [target] = await db
    .select({ isPrivate: users.isPrivate, username: users.username })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) throw new Error('User not found');

  const status = target.isPrivate ? 'pending' : 'accepted';

  const [follow] = await db
    .insert(follows)
    .values({
      followerId: user.id,
      followingId: targetUserId,
      status,
    })
    .returning({ id: follows.id });

  await createNotification({
    recipientId: targetUserId,
    actorId: user.id,
    type: status === 'pending' ? 'follow_request' : 'follow',
    entityId: follow!.id,
    entityType: 'follow',
  });

  revalidatePath(`/${target.username}`);
  return { status };
}

export async function unfollowUser(targetUserId: string) {
  const user = await getAuthenticatedUser();

  const [target] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  await db
    .delete(follows)
    .where(and(eq(follows.followerId, user.id), eq(follows.followingId, targetUserId)));

  if (target) revalidatePath(`/${target.username}`);
  return { success: true };
}

export async function acceptFollowRequest(requesterId: string) {
  const user = await getAuthenticatedUser();

  await db
    .update(follows)
    .set({ status: 'accepted' })
    .where(
      and(
        eq(follows.followerId, requesterId),
        eq(follows.followingId, user.id),
        eq(follows.status, 'pending'),
      ),
    );

  revalidatePath('/notifications');
  return { success: true };
}

export async function rejectFollowRequest(requesterId: string) {
  const user = await getAuthenticatedUser();

  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, requesterId),
        eq(follows.followingId, user.id),
        eq(follows.status, 'pending'),
      ),
    );

  revalidatePath('/notifications');
  return { success: true };
}

export async function removeFollower(followerId: string) {
  const user = await getAuthenticatedUser();

  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, user.id)));

  return { success: true };
}
