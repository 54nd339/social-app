'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { MAX_PINNED_POSTS } from '@/lib/constants';
import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { pinnedPosts, restricts, storyHighlights, users } from '@/lib/db/schema';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

export async function pinPost(postId: string) {
  const user = await getAuthenticatedUser();

  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pinnedPosts)
    .where(eq(pinnedPosts.userId, user.id));

  if ((count?.count ?? 0) >= MAX_PINNED_POSTS) {
    throw new Error(`Maximum ${MAX_PINNED_POSTS} pinned posts allowed`);
  }

  const [existing] = await db
    .select({ id: pinnedPosts.id })
    .from(pinnedPosts)
    .where(and(eq(pinnedPosts.userId, user.id), eq(pinnedPosts.postId, postId)))
    .limit(1);

  if (existing) throw new Error('Post already pinned');

  await db.insert(pinnedPosts).values({
    userId: user.id,
    postId,
    order: count?.count ?? 0,
  });

  revalidatePath(`/${user.username}`);
  return { success: true };
}

export async function unpinPost(postId: string) {
  const user = await getAuthenticatedUser();

  await db
    .delete(pinnedPosts)
    .where(and(eq(pinnedPosts.userId, user.id), eq(pinnedPosts.postId, postId)));

  revalidatePath(`/${user.username}`);
  return { success: true };
}

export async function updateStatus(statusText: string | null, statusEmoji: string | null) {
  const user = await getAuthenticatedUser();

  await db.update(users).set({ statusText, statusEmoji }).where(eq(users.id, user.id));

  revalidatePath(`/${user.username}`);
  return { success: true };
}

export async function restrictUser(targetUserId: string) {
  const user = await getAuthenticatedUser();
  if (user.id === targetUserId) throw new Error('Cannot restrict yourself');

  const [existing] = await db
    .select({ id: restricts.id })
    .from(restricts)
    .where(and(eq(restricts.restricterId, user.id), eq(restricts.restrictedId, targetUserId)))
    .limit(1);

  if (existing) throw new Error('User already restricted');

  await db.insert(restricts).values({
    restricterId: user.id,
    restrictedId: targetUserId,
  });

  return { success: true };
}

export async function unrestrictUser(targetUserId: string) {
  const user = await getAuthenticatedUser();

  await db
    .delete(restricts)
    .where(and(eq(restricts.restricterId, user.id), eq(restricts.restrictedId, targetUserId)));

  return { success: true };
}

export async function createStoryHighlight(name: string, coverUrl?: string) {
  const user = await getAuthenticatedUser();

  const [highlight] = await db
    .insert(storyHighlights)
    .values({
      userId: user.id,
      name,
      coverUrl: coverUrl ?? null,
    })
    .returning({ id: storyHighlights.id });

  revalidatePath(`/${user.username}`);
  return highlight!;
}

export async function deleteStoryHighlight(highlightId: string) {
  const user = await getAuthenticatedUser();

  await db
    .delete(storyHighlights)
    .where(and(eq(storyHighlights.id, highlightId), eq(storyHighlights.userId, user.id)));

  revalidatePath(`/${user.username}`);
  return { success: true };
}
