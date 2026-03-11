import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';

export interface DraftPost {
  id: string;
  content: string;
  visibility: string;
  scheduledAt: Date | null;
  timeCapsuleAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserDrafts(userId: string): Promise<DraftPost[]> {
  return db
    .select({
      id: posts.id,
      content: posts.content,
      visibility: posts.visibility,
      scheduledAt: posts.scheduledAt,
      timeCapsuleAt: posts.timeCapsuleAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.isDraft, true)))
    .orderBy(desc(posts.updatedAt));
}

export async function getScheduledPosts(userId: string): Promise<DraftPost[]> {
  return db
    .select({
      id: posts.id,
      content: posts.content,
      visibility: posts.visibility,
      scheduledAt: posts.scheduledAt,
      timeCapsuleAt: posts.timeCapsuleAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.authorId, userId),
        eq(posts.isDraft, false),
        isNotNull(posts.scheduledAt),
        isNull(posts.timeCapsuleAt),
      ),
    )
    .orderBy(posts.scheduledAt);
}
