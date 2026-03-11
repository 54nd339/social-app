import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  pinnedPosts,
  posts,
  profileViews,
  restricts,
  storyHighlights,
  userBadges,
  users,
} from '@/lib/db/schema';

export interface PinnedPostItem {
  id: string;
  postId: string;
  content: string;
  createdAt: Date;
  order: number;
}

export interface BadgeItem {
  id: string;
  badgeType: string;
  awardedAt: Date;
}

export interface ProfileViewer {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  viewedAt: Date;
}

export interface StoryHighlightItem {
  id: string;
  name: string;
  coverUrl: string | null;
  order: number;
}

export interface RestrictedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  restrictedAt: Date;
}

export async function getPinnedPosts(userId: string): Promise<PinnedPostItem[]> {
  const rows = await db
    .select({
      id: pinnedPosts.id,
      postId: pinnedPosts.postId,
      content: posts.content,
      createdAt: posts.createdAt,
      order: pinnedPosts.order,
    })
    .from(pinnedPosts)
    .innerJoin(posts, eq(pinnedPosts.postId, posts.id))
    .where(eq(pinnedPosts.userId, userId))
    .orderBy(pinnedPosts.order);

  return rows;
}

export async function getUserBadges(userId: string): Promise<BadgeItem[]> {
  return db
    .select({
      id: userBadges.id,
      badgeType: userBadges.badgeType,
      awardedAt: userBadges.awardedAt,
    })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.awardedAt));
}

export async function getProfileViewers(
  userId: string,
  limit: number = 50,
): Promise<ProfileViewer[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      viewedAt: profileViews.viewedAt,
    })
    .from(profileViews)
    .innerJoin(users, eq(profileViews.viewerId, users.id))
    .where(eq(profileViews.viewedUserId, userId))
    .orderBy(desc(profileViews.viewedAt))
    .limit(limit);

  return rows;
}

export async function getStoryHighlights(userId: string): Promise<StoryHighlightItem[]> {
  return db
    .select({
      id: storyHighlights.id,
      name: storyHighlights.name,
      coverUrl: storyHighlights.coverUrl,
      order: storyHighlights.order,
    })
    .from(storyHighlights)
    .where(eq(storyHighlights.userId, userId))
    .orderBy(storyHighlights.order);
}

export async function getRestrictedUsers(userId: string): Promise<RestrictedUser[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      restrictedAt: restricts.createdAt,
    })
    .from(restricts)
    .innerJoin(users, eq(restricts.restrictedId, users.id))
    .where(eq(restricts.restricterId, userId))
    .orderBy(desc(restricts.createdAt));

  return rows;
}

export async function recordProfileView(viewerId: string, viewedUserId: string) {
  if (viewerId === viewedUserId) return;

  const [viewedUser] = await db
    .select({ profileViewsEnabled: users.profileViewsEnabled, incognitoMode: users.incognitoMode })
    .from(users)
    .where(eq(users.id, viewedUserId))
    .limit(1);

  if (!viewedUser?.profileViewsEnabled) return;

  const [viewer] = await db
    .select({ incognitoMode: users.incognitoMode })
    .from(users)
    .where(eq(users.id, viewerId))
    .limit(1);

  if (viewer?.incognitoMode) return;

  await db.insert(profileViews).values({ viewerId, viewedUserId }).onConflictDoNothing();
}
