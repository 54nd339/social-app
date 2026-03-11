'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { comments } from '@/lib/db/schema';
import {
  type CreateCommentInput,
  createCommentSchema,
  type EditCommentInput,
  editCommentSchema,
} from '@/lib/validators/comment';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

export async function createComment(input: CreateCommentInput) {
  const user = await getAuthenticatedUser();
  const validated = createCommentSchema.parse(input);

  let depth = 0;
  if (validated.parentId) {
    const [parent] = await db
      .select({ depth: comments.depth })
      .from(comments)
      .where(eq(comments.id, validated.parentId))
      .limit(1);

    if (!parent) throw new Error('Parent comment not found');
    depth = parent.depth + 1;
  }

  const [comment] = await db
    .insert(comments)
    .values({
      postId: validated.postId,
      authorId: user.id,
      content: validated.content,
      parentId: validated.parentId ?? null,
      depth,
    })
    .returning({ id: comments.id, createdAt: comments.createdAt });

  revalidatePath(`/post/${validated.postId}`);
  return {
    id: comment!.id,
    createdAt: comment!.createdAt,
    author: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function editComment(input: EditCommentInput) {
  const user = await getAuthenticatedUser();
  const validated = editCommentSchema.parse(input);

  const [existing] = await db
    .select({ authorId: comments.authorId, postId: comments.postId })
    .from(comments)
    .where(eq(comments.id, validated.commentId))
    .limit(1);

  if (!existing) throw new Error('Comment not found');
  if (existing.authorId !== user.id) throw new Error('Not authorized');

  await db
    .update(comments)
    .set({
      content: validated.content,
      isEdited: true,
      editedAt: new Date(),
    })
    .where(eq(comments.id, validated.commentId));

  revalidatePath(`/post/${existing.postId}`);
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const user = await getAuthenticatedUser();

  const [existing] = await db
    .select({ authorId: comments.authorId, postId: comments.postId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!existing) throw new Error('Comment not found');
  if (existing.authorId !== user.id) throw new Error('Not authorized');

  await db.delete(comments).where(eq(comments.id, commentId));

  revalidatePath(`/post/${existing.postId}`);
  return { success: true };
}
