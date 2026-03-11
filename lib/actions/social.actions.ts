'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { follows, users } from '@/lib/db/schema';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

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

  await db.insert(follows).values({
    followerId: user.id,
    followingId: targetUserId,
    status,
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
