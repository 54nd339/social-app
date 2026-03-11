'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import {
  collectionItems,
  collections,
  comments,
  pollOptions,
  polls,
  pollVotes,
  postEditHistory,
  postMedia,
  posts,
  reactions,
  shares,
} from '@/lib/db/schema';
import {
  type CreatePostInput,
  createPostSchema,
  type EditPostInput,
  editPostSchema,
} from '@/lib/validators/post';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

export async function createPost(input: CreatePostInput) {
  const user = await getAuthenticatedUser();
  const validated = createPostSchema.parse(input);

  const [post] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      content: validated.content,
      visibility: validated.visibility,
      circleId: validated.circleId ?? null,
      contentWarning: validated.contentWarning ?? null,
      slowModeSeconds: validated.slowModeSeconds ?? 0,
      collabUserId: validated.collabUserId ?? null,
    })
    .returning({ id: posts.id });

  if (!post) throw new Error('Failed to create post');

  if (validated.images && validated.images.length > 0) {
    await db.insert(postMedia).values(
      validated.images.map((img, idx) => ({
        postId: post.id,
        url: img.url,
        type: 'image' as const,
        blurhash: img.blurhash ?? null,
        width: img.width ?? null,
        height: img.height ?? null,
        order: idx,
      })),
    );
  }

  if (validated.poll) {
    const [poll] = await db
      .insert(polls)
      .values({
        postId: post.id,
        question: validated.poll.question,
        expiresAt: validated.poll.expiresInHours
          ? new Date(Date.now() + validated.poll.expiresInHours * 60 * 60 * 1000)
          : null,
      })
      .returning({ id: polls.id });

    if (poll) {
      await db.insert(pollOptions).values(
        validated.poll.options.map((text, idx) => ({
          pollId: poll.id,
          text,
          order: idx,
        })),
      );
    }
  }

  revalidatePath('/');
  return { id: post.id };
}

export async function editPost(input: EditPostInput) {
  const user = await getAuthenticatedUser();
  const validated = editPostSchema.parse(input);

  const [existing] = await db
    .select({ id: posts.id, authorId: posts.authorId, content: posts.content })
    .from(posts)
    .where(eq(posts.id, validated.postId))
    .limit(1);

  if (!existing) throw new Error('Post not found');
  if (existing.authorId !== user.id) throw new Error('Not authorized');

  await db.insert(postEditHistory).values({
    postId: existing.id,
    previousContent: existing.content,
  });

  await db
    .update(posts)
    .set({
      content: validated.content,
      isEdited: true,
      editedAt: new Date(),
    })
    .where(eq(posts.id, validated.postId));

  revalidatePath('/');
  return { success: true };
}

export async function deletePost(postId: string) {
  const user = await getAuthenticatedUser();

  const [existing] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!existing) throw new Error('Post not found');
  if (existing.authorId !== user.id) throw new Error('Not authorized');

  await db.delete(posts).where(eq(posts.id, postId));

  revalidatePath('/');
  return { success: true };
}

export async function toggleReaction(
  entityId: string,
  entityType: 'post' | 'comment',
  reactionType: string,
) {
  const user = await getAuthenticatedUser();

  const [existing] = await db
    .select({ id: reactions.id, reactionType: reactions.reactionType })
    .from(reactions)
    .where(
      and(
        eq(reactions.userId, user.id),
        eq(reactions.entityId, entityId),
        eq(reactions.entityType, entityType),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.reactionType === reactionType) {
      await db.delete(reactions).where(eq(reactions.id, existing.id));
      return { action: 'removed' as const, reactionType: null };
    }

    await db.update(reactions).set({ reactionType }).where(eq(reactions.id, existing.id));
    return { action: 'changed' as const, reactionType };
  }

  await db.insert(reactions).values({
    userId: user.id,
    entityId,
    entityType,
    reactionType,
  });

  return { action: 'added' as const, reactionType };
}

export async function bookmarkPost(postId: string) {
  const user = await getAuthenticatedUser();

  const [defaultCollection] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.userId, user.id), eq(collections.isDefault, true)))
    .limit(1);

  if (!defaultCollection) throw new Error('No default collection found');

  const [existing] = await db
    .select({ id: collectionItems.id })
    .from(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, defaultCollection.id),
        eq(collectionItems.postId, postId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(collectionItems).where(eq(collectionItems.id, existing.id));
    return { bookmarked: false };
  }

  await db.insert(collectionItems).values({
    collectionId: defaultCollection.id,
    postId,
  });

  return { bookmarked: true };
}

export async function sharePost(postId: string, quoteContent?: string) {
  const user = await getAuthenticatedUser();

  await db.insert(shares).values({
    userId: user.id,
    postId,
    quoteContent: quoteContent ?? null,
  });

  revalidatePath('/');
  return { success: true };
}

export async function votePoll(optionId: string) {
  const user = await getAuthenticatedUser();

  const [option] = await db
    .select({ pollId: pollOptions.pollId })
    .from(pollOptions)
    .where(eq(pollOptions.id, optionId))
    .limit(1);

  if (!option) throw new Error('Poll option not found');

  const [poll] = await db
    .select({ expiresAt: polls.expiresAt })
    .from(polls)
    .where(eq(polls.id, option.pollId))
    .limit(1);

  if (poll?.expiresAt && poll.expiresAt < new Date()) {
    throw new Error('Poll has expired');
  }

  const samePolloptions = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, option.pollId));

  const samePollOptionIds = samePolloptions.map((o) => o.id);

  const existingVotes = await db
    .select({ id: pollVotes.id })
    .from(pollVotes)
    .where(
      and(eq(pollVotes.userId, user.id), sql`${pollVotes.optionId} = ANY(${samePollOptionIds})`),
    )
    .limit(1);

  if (existingVotes.length > 0) {
    throw new Error('Already voted on this poll');
  }

  await db.insert(pollVotes).values({
    optionId,
    userId: user.id,
  });

  revalidatePath('/');
  return { success: true };
}

export async function addComment(postId: string, content: string, parentId?: string) {
  const user = await getAuthenticatedUser();

  let depth = 0;
  if (parentId) {
    const [parent] = await db
      .select({ depth: comments.depth })
      .from(comments)
      .where(eq(comments.id, parentId))
      .limit(1);

    if (!parent) throw new Error('Parent comment not found');
    depth = parent.depth + 1;
  }

  const [comment] = await db
    .insert(comments)
    .values({
      postId,
      authorId: user.id,
      content,
      parentId: parentId ?? null,
      depth,
    })
    .returning({ id: comments.id });

  revalidatePath('/');
  return { id: comment!.id };
}
