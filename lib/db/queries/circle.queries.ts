import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { circleMembers, circles, posts, users } from '@/lib/db/schema';

export interface CircleWithCount {
  id: string;
  name: string;
  emoji: string | null;
  memberCount: number;
  createdAt: Date;
}

export interface CircleMember {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

export interface CirclePost {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export async function getUserCircles(userId: string): Promise<CircleWithCount[]> {
  const raw = await db
    .select({
      id: circles.id,
      name: circles.name,
      emoji: circles.emoji,
      createdAt: circles.createdAt,
    })
    .from(circles)
    .where(eq(circles.ownerId, userId))
    .orderBy(circles.createdAt);

  const counts = await Promise.all(
    raw.map(async (c) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(circleMembers)
        .where(eq(circleMembers.circleId, c.id));
      return { id: c.id, count: row?.count ?? 0 };
    }),
  );

  const countMap = new Map(counts.map((c) => [c.id, c.count]));

  return raw.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    memberCount: countMap.get(c.id) ?? 0,
    createdAt: c.createdAt,
  }));
}

export async function getCircleMembers(circleId: string): Promise<CircleMember[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      joinedAt: circleMembers.createdAt,
    })
    .from(circleMembers)
    .innerJoin(users, eq(circleMembers.userId, users.id))
    .where(eq(circleMembers.circleId, circleId))
    .orderBy(circleMembers.createdAt);

  return rows;
}

export async function getCirclePosts(
  circleId: string,
  cursor?: string,
  limit: number = 20,
): Promise<{ posts: CirclePost[]; nextCursor: string | null }> {
  const conditions = [
    eq(posts.circleId, circleId),
    eq(posts.isDraft, false),
    isNull(posts.scheduledAt),
  ];

  if (cursor) {
    conditions.push(sql`${posts.createdAt} < ${new Date(cursor)}`);
  }

  const rawPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = rawPosts.length > limit;
  const sliced = hasMore ? rawPosts.slice(0, limit) : rawPosts;
  const nextCursor = hasMore ? sliced[sliced.length - 1]!.createdAt.toISOString() : null;

  if (sliced.length === 0) return { posts: [], nextCursor: null };

  const authorIds = [...new Set(sliced.map((p) => p.authorId))];
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

  return {
    posts: sliced.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      author: authorMap.get(p.authorId)!,
    })),
    nextCursor,
  };
}
