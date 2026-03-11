'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { STORY_DURATION_HOURS } from '@/lib/constants';
import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { stories, storyViews } from '@/lib/db/schema';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

export async function createStory(input: {
  mediaUrl: string;
  mediaType?: string;
  caption?: string;
  bgColor?: string;
  visibility?: string;
}) {
  const user = await getAuthenticatedUser();

  const expiresAt = new Date(Date.now() + STORY_DURATION_HOURS * 60 * 60 * 1000);

  const [story] = await db
    .insert(stories)
    .values({
      authorId: user.id,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType ?? 'image',
      caption: input.caption ?? null,
      bgColor: input.bgColor ?? null,
      visibility: input.visibility ?? 'public',
      expiresAt,
    })
    .returning({ id: stories.id });

  revalidatePath('/');
  return { id: story!.id };
}

export async function viewStory(storyId: string) {
  const user = await getAuthenticatedUser();

  const [existing] = await db
    .select({ id: storyViews.id })
    .from(storyViews)
    .where(and(eq(storyViews.storyId, storyId), eq(storyViews.viewerId, user.id)))
    .limit(1);

  if (!existing) {
    await db.insert(storyViews).values({
      storyId,
      viewerId: user.id,
    });
  }

  return { success: true };
}

export async function deleteStory(storyId: string) {
  const user = await getAuthenticatedUser();

  const [story] = await db
    .select({ authorId: stories.authorId })
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);

  if (!story) throw new Error('Story not found');
  if (story.authorId !== user.id) throw new Error('Not authorized');

  await db.delete(stories).where(eq(stories.id, storyId));

  revalidatePath('/');
  return { success: true };
}
