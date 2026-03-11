import { and, eq, gt, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { stories, storyViews, users } from '@/lib/db/schema';

export interface StoryRing {
  userId: string;
  clerkId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  storyCount: number;
  hasUnviewed: boolean;
  latestStoryId: string;
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  bgColor: string | null;
  fontStyle: string | null;
  createdAt: Date;
  expiresAt: Date;
  viewCount: number;
  isViewed: boolean;
}

export async function getStoryRings(currentUserId: string): Promise<StoryRing[]> {
  const activeStories = await db
    .select({
      authorId: stories.authorId,
      storyCount: sql<number>`count(*)::int`,
      latestStoryId: sql<string>`(array_agg(${stories.id} ORDER BY ${stories.createdAt} DESC))[1]`,
    })
    .from(stories)
    .where(gt(stories.expiresAt, new Date()))
    .groupBy(stories.authorId);

  if (activeStories.length === 0) return [];

  const authorIds = activeStories.map((s) => s.authorId);

  const [authorsData, viewedData] = await Promise.all([
    db
      .select({
        id: users.id,
        clerkId: users.clerkId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(sql`${users.id} = ANY(${authorIds})`),
    db
      .select({ storyId: storyViews.storyId })
      .from(storyViews)
      .innerJoin(stories, eq(storyViews.storyId, stories.id))
      .where(
        and(
          eq(storyViews.viewerId, currentUserId),
          sql`${stories.authorId} = ANY(${authorIds})`,
          gt(stories.expiresAt, new Date()),
        ),
      ),
  ]);

  const authorMap = new Map(authorsData.map((a) => [a.id, a]));
  const viewedStoryIds = new Set(viewedData.map((v) => v.storyId));

  const allActiveStoryIds = await db
    .select({ id: stories.id, authorId: stories.authorId })
    .from(stories)
    .where(gt(stories.expiresAt, new Date()));

  const authorStoryMap = new Map<string, string[]>();
  for (const s of allActiveStoryIds) {
    const existing = authorStoryMap.get(s.authorId) ?? [];
    existing.push(s.id);
    authorStoryMap.set(s.authorId, existing);
  }

  const rings: StoryRing[] = [];
  const selfFirst: StoryRing[] = [];

  for (const s of activeStories) {
    const author = authorMap.get(s.authorId);
    if (!author) continue;

    const authorStoryIds = authorStoryMap.get(s.authorId) ?? [];
    const hasUnviewed = authorStoryIds.some((id) => !viewedStoryIds.has(id));

    const ring: StoryRing = {
      userId: author.id,
      clerkId: author.clerkId,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
      storyCount: s.storyCount,
      hasUnviewed,
      latestStoryId: s.latestStoryId,
    };

    if (author.id === currentUserId) {
      selfFirst.push(ring);
    } else {
      rings.push(ring);
    }
  }

  rings.sort((a, b) => (a.hasUnviewed === b.hasUnviewed ? 0 : a.hasUnviewed ? -1 : 1));

  return [...selfFirst, ...rings];
}

export async function getUserStories(
  authorId: string,
  currentUserId: string,
): Promise<StoryItem[]> {
  const rawStories = await db
    .select({
      id: stories.id,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      caption: stories.caption,
      bgColor: stories.bgColor,
      fontStyle: stories.fontStyle,
      createdAt: stories.createdAt,
      expiresAt: stories.expiresAt,
    })
    .from(stories)
    .where(and(eq(stories.authorId, authorId), gt(stories.expiresAt, new Date())))
    .orderBy(stories.createdAt);

  if (rawStories.length === 0) return [];

  const storyIds = rawStories.map((s) => s.id);

  const [viewCounts, viewedByMe] = await Promise.all([
    db
      .select({
        storyId: storyViews.storyId,
        count: sql<number>`count(*)::int`,
      })
      .from(storyViews)
      .where(sql`${storyViews.storyId} = ANY(${storyIds})`)
      .groupBy(storyViews.storyId),
    db
      .select({ storyId: storyViews.storyId })
      .from(storyViews)
      .where(
        and(sql`${storyViews.storyId} = ANY(${storyIds})`, eq(storyViews.viewerId, currentUserId)),
      ),
  ]);

  const viewCountMap = new Map(viewCounts.map((v) => [v.storyId, v.count]));
  const viewedSet = new Set(viewedByMe.map((v) => v.storyId));

  return rawStories.map((s) => ({
    ...s,
    viewCount: viewCountMap.get(s.id) ?? 0,
    isViewed: viewedSet.has(s.id),
  }));
}
