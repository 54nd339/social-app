import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { comments, reactions, users } from '@/lib/db/schema';

export interface CommentWithAuthor {
  id: string;
  postId: string;
  content: string;
  parentId: string | null;
  depth: number;
  isEdited: boolean;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  reactionCounts: Record<string, number>;
  userReaction: string | null;
  replyCount: number;
  replies: CommentWithAuthor[];
}

export async function getCommentsForPost(
  postId: string,
  userId: string,
): Promise<CommentWithAuthor[]> {
  const allComments = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      content: comments.content,
      parentId: comments.parentId,
      depth: comments.depth,
      isEdited: comments.isEdited,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
    })
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));

  if (allComments.length === 0) return [];

  const commentIds = allComments.map((c) => c.id);
  const authorIds = [...new Set(allComments.map((c) => c.authorId))];

  const [usersData, reactionsData, userReactions] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(sql`${users.id} = ANY(${authorIds})`),
    db
      .select({
        entityId: reactions.entityId,
        reactionType: reactions.reactionType,
        count: sql<number>`count(*)::int`,
      })
      .from(reactions)
      .where(
        and(sql`${reactions.entityId} = ANY(${commentIds})`, eq(reactions.entityType, 'comment')),
      )
      .groupBy(reactions.entityId, reactions.reactionType),
    db
      .select({ entityId: reactions.entityId, reactionType: reactions.reactionType })
      .from(reactions)
      .where(
        and(
          sql`${reactions.entityId} = ANY(${commentIds})`,
          eq(reactions.entityType, 'comment'),
          eq(reactions.userId, userId),
        ),
      ),
  ]);

  const userMap = new Map(usersData.map((u) => [u.id, u]));

  const reactionCountMap = new Map<string, Record<string, number>>();
  for (const r of reactionsData) {
    const existing = reactionCountMap.get(r.entityId) ?? {};
    existing[r.reactionType] = r.count;
    reactionCountMap.set(r.entityId, existing);
  }

  const userReactionMap = new Map(userReactions.map((r) => [r.entityId, r.reactionType]));

  const replyCountMap = new Map<string, number>();
  for (const c of allComments) {
    if (c.parentId) {
      replyCountMap.set(c.parentId, (replyCountMap.get(c.parentId) ?? 0) + 1);
    }
  }

  const commentMap = new Map<string, CommentWithAuthor>();
  const topLevel: CommentWithAuthor[] = [];

  for (const c of allComments) {
    const author = userMap.get(c.authorId)!;
    const node: CommentWithAuthor = {
      id: c.id,
      postId: c.postId,
      content: c.content,
      parentId: c.parentId,
      depth: c.depth,
      isEdited: c.isEdited ?? false,
      createdAt: c.createdAt,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
      },
      reactionCounts: reactionCountMap.get(c.id) ?? {},
      userReaction: userReactionMap.get(c.id) ?? null,
      replyCount: replyCountMap.get(c.id) ?? 0,
      replies: [],
    };

    commentMap.set(c.id, node);

    if (!c.parentId) {
      topLevel.push(node);
    }
  }

  for (const c of allComments) {
    if (c.parentId) {
      const parent = commentMap.get(c.parentId);
      const child = commentMap.get(c.id);
      if (parent && child) {
        parent.replies.push(child);
      }
    }
  }

  return topLevel;
}

export async function getPostById(postId: string) {
  const { posts, postMedia, postLinkPreviews, polls, pollOptions } =
    await import('@/lib/db/schema');

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

  if (!post) return null;

  const [author, media, linkPreviews, pollData] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1)
      .then((rows) => rows[0]!),
    db.select().from(postMedia).where(eq(postMedia.postId, postId)).orderBy(asc(postMedia.order)),
    db.select().from(postLinkPreviews).where(eq(postLinkPreviews.postId, postId)).limit(1),
    db.select().from(polls).where(eq(polls.postId, postId)).limit(1),
  ]);

  let pollWithOptions = null;
  if (pollData.length > 0) {
    const opts = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollData[0]!.id))
      .orderBy(asc(pollOptions.order));

    pollWithOptions = {
      ...pollData[0]!,
      options: opts,
    };
  }

  let collabUser = null;
  if (post.collabUserId) {
    [collabUser] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, post.collabUserId))
      .limit(1);
  }

  return {
    ...post,
    author,
    collabUser,
    media,
    linkPreview: linkPreviews[0] ?? null,
    poll: pollWithOptions,
  };
}
