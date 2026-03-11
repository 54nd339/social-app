import { desc, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { collectionItems, collections, posts, users } from '@/lib/db/schema';

export interface CollectionWithCount {
  id: string;
  name: string;
  emoji: string | null;
  isDefault: boolean;
  itemCount: number;
  previewUrl: string | null;
  createdAt: Date;
}

export interface CollectionPost {
  id: string;
  content: string;
  createdAt: Date;
  addedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export async function getUserCollections(userId: string): Promise<CollectionWithCount[]> {
  const raw = await db
    .select({
      id: collections.id,
      name: collections.name,
      emoji: collections.emoji,
      isDefault: collections.isDefault,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(collections.order);

  const counts = await Promise.all(
    raw.map(async (col) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, col.id));
      return { id: col.id, count: row?.count ?? 0 };
    }),
  );

  const countMap = new Map(counts.map((c) => [c.id, c.count]));

  return raw.map((col) => ({
    id: col.id,
    name: col.name,
    emoji: col.emoji,
    isDefault: col.isDefault,
    itemCount: countMap.get(col.id) ?? 0,
    previewUrl: null,
    createdAt: col.createdAt,
  }));
}

export async function getCollectionPosts(
  collectionId: string,
  cursor?: string,
  limit: number = 20,
): Promise<{ posts: CollectionPost[]; nextCursor: string | null }> {
  const conditions = [eq(collectionItems.collectionId, collectionId)];
  if (cursor) {
    conditions.push(sql`${collectionItems.addedAt} < ${new Date(cursor)}`);
  }

  const items = await db
    .select({
      postId: collectionItems.postId,
      addedAt: collectionItems.addedAt,
      content: posts.content,
      postCreatedAt: posts.createdAt,
      authorId: users.id,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(collectionItems)
    .innerJoin(posts, eq(collectionItems.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(
      sql`${conditions.reduce((acc, c, i) => (i === 0 ? c : sql`${acc} AND ${c}`), conditions[0]!)}`,
    )
    .orderBy(desc(collectionItems.addedAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? sliced[sliced.length - 1]!.addedAt.toISOString() : null;

  return {
    posts: sliced.map((item) => ({
      id: item.postId,
      content: item.content ?? '',
      createdAt: item.postCreatedAt,
      addedAt: item.addedAt,
      author: {
        id: item.authorId,
        username: item.authorUsername,
        displayName: item.authorDisplayName,
        avatarUrl: item.authorAvatarUrl,
      },
    })),
    nextCursor,
  };
}
