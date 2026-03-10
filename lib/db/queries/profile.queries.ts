import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { follows, posts, users } from '@/lib/db/schema';

export interface ProfileData {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  statusText: string | null;
  statusEmoji: string | null;
  isPrivate: boolean;
  createdAt: Date;
  followerCount: number;
  followingCount: number;
  postCount: number;
  followStatus: 'none' | 'following' | 'pending' | 'self';
}

export async function getProfileByUsername(
  username: string,
  currentUserId: string,
): Promise<ProfileData | null> {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user) return null;

  const isSelf = user.id === currentUserId;

  const [followerCount, followingCount, postCount, followRelation] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(and(eq(follows.followingId, user.id), eq(follows.status, 'accepted')))
      .then((rows) => rows[0]?.count ?? 0),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(and(eq(follows.followerId, user.id), eq(follows.status, 'accepted')))
      .then((rows) => rows[0]?.count ?? 0),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), eq(posts.isDraft, false), isNull(posts.scheduledAt)))
      .then((rows) => rows[0]?.count ?? 0),
    isSelf
      ? Promise.resolve(null)
      : db
          .select({ status: follows.status })
          .from(follows)
          .where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, user.id)))
          .limit(1)
          .then((rows) => rows[0] ?? null),
  ]);

  let followStatus: ProfileData['followStatus'] = 'none';
  if (isSelf) {
    followStatus = 'self';
  } else if (followRelation) {
    followStatus = followRelation.status === 'accepted' ? 'following' : 'pending';
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bio: user.bio,
    location: user.location,
    website: user.website,
    statusText: user.statusText,
    statusEmoji: user.statusEmoji,
    isPrivate: user.isPrivate,
    createdAt: user.createdAt,
    followerCount,
    followingCount,
    postCount,
    followStatus,
  };
}

export async function getUserPosts(userId: string, cursor?: string, limit: number = 20) {
  const conditions = [
    eq(posts.authorId, userId),
    eq(posts.isDraft, false),
    isNull(posts.scheduledAt),
    isNull(posts.timeCapsuleAt),
  ];

  if (cursor) {
    const { lt } = await import('drizzle-orm');
    conditions.push(lt(posts.createdAt, new Date(cursor)));
  }

  const { and: andFn } = await import('drizzle-orm');

  const rawPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      visibility: posts.visibility,
      contentWarning: posts.contentWarning,
      isEdited: posts.isEdited,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(andFn(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = rawPosts.length > limit;
  const postsSlice = hasMore ? rawPosts.slice(0, limit) : rawPosts;
  const nextCursor = hasMore ? postsSlice[postsSlice.length - 1]!.createdAt.toISOString() : null;

  return { posts: postsSlice, nextCursor };
}
