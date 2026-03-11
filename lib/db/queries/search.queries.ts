import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { follows, posts, users } from '@/lib/db/schema';

export interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export interface SearchPost {
  id: string;
  content: string;
  contentWarning: string | null;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export async function searchUsers(
  query: string,
  currentUserId: string,
  limit: number = 20,
): Promise<SearchUser[]> {
  const pattern = `%${query}%`;

  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(users)
    .where(
      and(
        or(ilike(users.username, pattern), ilike(users.displayName, pattern)),
        sql`${users.id} != ${currentUserId}`,
      ),
    )
    .limit(limit);

  if (results.length === 0) return [];

  const resultIds = results.map((r) => r.id);
  const followStatuses = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, currentUserId),
        sql`${follows.followingId} = ANY(${resultIds})`,
        eq(follows.status, 'accepted'),
      ),
    );

  const followingSet = new Set(followStatuses.map((f) => f.followingId));

  return results.map((u) => ({
    ...u,
    isFollowing: followingSet.has(u.id),
  }));
}

export async function searchPosts(query: string, limit: number = 20): Promise<SearchPost[]> {
  const pattern = `%${query}%`;

  const rawPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      contentWarning: posts.contentWarning,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(
      and(
        ilike(posts.content, pattern),
        eq(posts.visibility, 'public'),
        eq(posts.isDraft, false),
        isNull(posts.scheduledAt),
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  if (rawPosts.length === 0) return [];

  const authorIds = [...new Set(rawPosts.map((p) => p.authorId))];
  const authorsData = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(sql`${users.id} = ANY(${authorIds})`);

  const authorMap = new Map(authorsData.map((a) => [a.id, a]));

  return rawPosts.map((p) => ({
    id: p.id,
    content: p.content,
    contentWarning: p.contentWarning,
    createdAt: p.createdAt,
    author: authorMap.get(p.authorId)!,
  }));
}

export async function getSuggestedUsers(
  currentUserId: string,
  limit: number = 10,
): Promise<SearchUser[]> {
  const alreadyFollowing = db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, currentUserId));

  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(users)
    .where(
      and(
        sql`${users.id} != ${currentUserId}`,
        sql`${users.id} NOT IN (${alreadyFollowing})`,
        eq(users.onboardingComplete, true),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  return results.map((u) => ({ ...u, isFollowing: false }));
}

export async function getTrendingPosts(limit: number = 20): Promise<SearchPost[]> {
  const rawPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      contentWarning: posts.contentWarning,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(
      and(
        eq(posts.visibility, 'public'),
        eq(posts.isDraft, false),
        isNull(posts.scheduledAt),
        sql`${posts.createdAt} > NOW() - INTERVAL '7 days'`,
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  if (rawPosts.length === 0) return [];

  const authorIds = [...new Set(rawPosts.map((p) => p.authorId))];
  const authorsData = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(sql`${users.id} = ANY(${authorIds})`);

  const authorMap = new Map(authorsData.map((a) => [a.id, a]));

  return rawPosts.map((p) => ({
    id: p.id,
    content: p.content,
    contentWarning: p.contentWarning,
    createdAt: p.createdAt,
    author: authorMap.get(p.authorId)!,
  }));
}
