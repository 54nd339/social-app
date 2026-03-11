import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm';

import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { db } from '@/lib/db';
import {
  circleMembers,
  collectionItems,
  collections,
  comments,
  follows,
  hashtags,
  pinnedPosts,
  pollOptions,
  polls,
  pollVotes,
  postHashtags,
  postLinkPreviews,
  postMedia,
  posts,
  reactions,
  shares,
  users,
} from '@/lib/db/schema';

export interface FeedPost {
  id: string;
  content: string;
  visibility: string;
  contentWarning: string | null;
  slowModeSeconds: number | null;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  collabUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  media: Array<{
    id: string;
    url: string;
    type: string;
    blurhash: string | null;
    width: number | null;
    height: number | null;
    order: number;
  }>;
  linkPreview: {
    url: string;
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    siteName: string | null;
  } | null;
  poll: {
    id: string;
    question: string;
    expiresAt: Date | null;
    options: Array<{
      id: string;
      text: string;
      voteCount: number;
    }>;
    userVotedOptionId: string | null;
  } | null;
  reactionCounts: Record<string, number>;
  userReaction: string | null;
  commentCount: number;
  shareCount: number;
  isBookmarked: boolean;
  isPinned: boolean;
}

export async function getFeedPosts(
  userId: string,
  cursor?: string,
  limit: number = DEFAULT_PAGE_SIZE,
): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const userCircleIds = db
    .select({ circleId: circleMembers.circleId })
    .from(circleMembers)
    .where(eq(circleMembers.userId, userId));

  const followedUserIds = db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.status, 'accepted')));

  const conditions = [
    eq(posts.isDraft, false),
    isNull(posts.scheduledAt),
    isNull(posts.timeCapsuleAt),
    or(
      eq(posts.visibility, 'public'),
      eq(posts.authorId, userId),
      and(eq(posts.visibility, 'followers'), sql`${posts.authorId} IN (${followedUserIds})`),
      and(eq(posts.visibility, 'circle'), sql`${posts.circleId} IN (${userCircleIds})`),
    ),
  ];

  if (cursor) {
    conditions.push(lt(posts.createdAt, new Date(cursor)));
  }

  const rawPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      visibility: posts.visibility,
      contentWarning: posts.contentWarning,
      slowModeSeconds: posts.slowModeSeconds,
      isEdited: posts.isEdited,
      editedAt: posts.editedAt,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      collabUserId: posts.collabUserId,
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = rawPosts.length > limit;
  const postsSlice = hasMore ? rawPosts.slice(0, limit) : rawPosts;
  const nextCursor = hasMore ? postsSlice[postsSlice.length - 1]!.createdAt.toISOString() : null;

  if (postsSlice.length === 0) {
    return { posts: [], nextCursor: null };
  }

  const postIds = postsSlice.map((p) => p.id);
  const authorIds = [...new Set(postsSlice.map((p) => p.authorId))];
  const collabIds = postsSlice.map((p) => p.collabUserId).filter(Boolean) as string[];
  const allUserIds = [...new Set([...authorIds, ...collabIds])];

  const [
    usersData,
    mediaData,
    linkPreviews,
    pollsData,
    reactionsData,
    commentCounts,
    shareCounts,
    userReactions,
    bookmarkedPostIds,
    pinnedPostIds,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(sql`${users.id} = ANY(${allUserIds})`),
    db
      .select()
      .from(postMedia)
      .where(sql`${postMedia.postId} = ANY(${postIds})`)
      .orderBy(postMedia.order),
    db
      .select()
      .from(postLinkPreviews)
      .where(sql`${postLinkPreviews.postId} = ANY(${postIds})`),
    db
      .select()
      .from(polls)
      .where(sql`${polls.postId} = ANY(${postIds})`),
    db
      .select({
        entityId: reactions.entityId,
        reactionType: reactions.reactionType,
        count: sql<number>`count(*)::int`,
      })
      .from(reactions)
      .where(and(sql`${reactions.entityId} = ANY(${postIds})`, eq(reactions.entityType, 'post')))
      .groupBy(reactions.entityId, reactions.reactionType),
    db
      .select({
        postId: comments.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(sql`${comments.postId} = ANY(${postIds})`)
      .groupBy(comments.postId),
    db
      .select({
        postId: shares.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(shares)
      .where(sql`${shares.postId} = ANY(${postIds})`)
      .groupBy(shares.postId),
    db
      .select({ entityId: reactions.entityId, reactionType: reactions.reactionType })
      .from(reactions)
      .where(
        and(
          sql`${reactions.entityId} = ANY(${postIds})`,
          eq(reactions.entityType, 'post'),
          eq(reactions.userId, userId),
        ),
      ),
    db
      .select({ postId: collectionItems.postId })
      .from(collectionItems)
      .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
      .where(and(eq(collections.userId, userId), sql`${collectionItems.postId} = ANY(${postIds})`)),
    db
      .select({ postId: pinnedPosts.postId })
      .from(pinnedPosts)
      .where(and(eq(pinnedPosts.userId, userId), sql`${pinnedPosts.postId} = ANY(${postIds})`)),
  ]);

  const userMap = new Map(usersData.map((u) => [u.id, u]));
  const mediaMap = new Map<string, typeof mediaData>();
  for (const m of mediaData) {
    const existing = mediaMap.get(m.postId) ?? [];
    existing.push(m);
    mediaMap.set(m.postId, existing);
  }
  const linkPreviewMap = new Map(linkPreviews.map((lp) => [lp.postId, lp]));
  const pollMap = new Map(pollsData.map((p) => [p.postId, p]));
  const reactionCountMap = new Map<string, Record<string, number>>();
  for (const r of reactionsData) {
    const existing = reactionCountMap.get(r.entityId) ?? {};
    existing[r.reactionType] = r.count;
    reactionCountMap.set(r.entityId, existing);
  }
  const commentCountMap = new Map(commentCounts.map((c) => [c.postId, c.count]));
  const shareCountMap = new Map(shareCounts.map((s) => [s.postId, s.count]));
  const userReactionMap = new Map(userReactions.map((r) => [r.entityId, r.reactionType]));
  const bookmarkedSet = new Set(bookmarkedPostIds.map((b) => b.postId));
  const pinnedSet = new Set(pinnedPostIds.map((p) => p.postId));

  let pollOptionsData: Array<{ id: string; pollId: string; text: string; order: number }> = [];
  let pollVotesData: Array<{ optionId: string; count: number }> = [];
  let userPollVotes: Array<{ optionId: string }> = [];

  const pollIds = pollsData.map((p) => p.id);
  if (pollIds.length > 0) {
    [pollOptionsData, pollVotesData, userPollVotes] = await Promise.all([
      db
        .select({
          id: pollOptions.id,
          pollId: pollOptions.pollId,
          text: pollOptions.text,
          order: pollOptions.order,
        })
        .from(pollOptions)
        .where(sql`${pollOptions.pollId} = ANY(${pollIds})`)
        .orderBy(pollOptions.order),
      db
        .select({
          optionId: pollVotes.optionId,
          count: sql<number>`count(*)::int`,
        })
        .from(pollVotes)
        .where(sql`${pollVotes.optionId} = ANY(${pollIds})`)
        .groupBy(pollVotes.optionId),
      db
        .select({ optionId: pollVotes.optionId })
        .from(pollVotes)
        .where(and(sql`${pollVotes.optionId} = ANY(${pollIds})`, eq(pollVotes.userId, userId))),
    ]);
  }

  const pollOptionsMap = new Map<string, typeof pollOptionsData>();
  for (const o of pollOptionsData) {
    const existing = pollOptionsMap.get(o.pollId) ?? [];
    existing.push(o);
    pollOptionsMap.set(o.pollId, existing);
  }
  const pollVoteCountMap = new Map(pollVotesData.map((v) => [v.optionId, v.count]));
  const userPollVoteSet = new Set(userPollVotes.map((v) => v.optionId));

  const feedPosts: FeedPost[] = postsSlice.map((post) => {
    const author = userMap.get(post.authorId)!;
    const collab = post.collabUserId ? (userMap.get(post.collabUserId) ?? null) : null;
    const pollData = pollMap.get(post.id);
    const opts = pollData ? (pollOptionsMap.get(pollData.id) ?? []) : [];
    const userVoted = opts.find((o) => userPollVoteSet.has(o.id));
    const lp = linkPreviewMap.get(post.id);

    return {
      id: post.id,
      content: post.content,
      visibility: post.visibility,
      contentWarning: post.contentWarning,
      slowModeSeconds: post.slowModeSeconds,
      isEdited: post.isEdited ?? false,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
      },
      collabUser: collab
        ? {
            id: collab.id,
            username: collab.username,
            displayName: collab.displayName,
            avatarUrl: collab.avatarUrl,
          }
        : null,
      media: (mediaMap.get(post.id) ?? []).map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        blurhash: m.blurhash,
        width: m.width,
        height: m.height,
        order: m.order,
      })),
      linkPreview: lp
        ? {
            url: lp.url,
            title: lp.title,
            description: lp.description,
            imageUrl: lp.imageUrl,
            siteName: lp.siteName,
          }
        : null,
      poll: pollData
        ? {
            id: pollData.id,
            question: pollData.question,
            expiresAt: pollData.expiresAt,
            options: opts.map((o) => ({
              id: o.id,
              text: o.text,
              voteCount: pollVoteCountMap.get(o.id) ?? 0,
            })),
            userVotedOptionId: userVoted?.id ?? null,
          }
        : null,
      reactionCounts: reactionCountMap.get(post.id) ?? {},
      userReaction: userReactionMap.get(post.id) ?? null,
      commentCount: commentCountMap.get(post.id) ?? 0,
      shareCount: shareCountMap.get(post.id) ?? 0,
      isBookmarked: bookmarkedSet.has(post.id),
      isPinned: pinnedSet.has(post.id),
    };
  });

  return { posts: feedPosts, nextCursor };
}

export async function getPostsByHashtag(
  tag: string,
  userId: string,
  cursor?: string,
  limit: number = DEFAULT_PAGE_SIZE,
): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const normalizedTag = tag.replace(/^#/, '').toLowerCase();
  const [hashtag] = await db
    .select()
    .from(hashtags)
    .where(eq(hashtags.name, normalizedTag))
    .limit(1);

  if (!hashtag) {
    return { posts: [], nextCursor: null };
  }

  const userCircleIds = db
    .select({ circleId: circleMembers.circleId })
    .from(circleMembers)
    .where(eq(circleMembers.userId, userId));

  const followedUserIds = db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.status, 'accepted')));

  const conditions = [
    eq(posts.isDraft, false),
    isNull(posts.scheduledAt),
    isNull(posts.timeCapsuleAt),
    eq(postHashtags.hashtagId, hashtag.id),
    or(
      eq(posts.visibility, 'public'),
      eq(posts.authorId, userId),
      and(eq(posts.visibility, 'followers'), sql`${posts.authorId} IN (${followedUserIds})`),
      and(eq(posts.visibility, 'circle'), sql`${posts.circleId} IN (${userCircleIds})`),
    ),
  ];

  if (cursor) {
    conditions.push(lt(posts.createdAt, new Date(cursor)));
  }

  const rawPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      visibility: posts.visibility,
      contentWarning: posts.contentWarning,
      slowModeSeconds: posts.slowModeSeconds,
      isEdited: posts.isEdited,
      editedAt: posts.editedAt,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      collabUserId: posts.collabUserId,
    })
    .from(posts)
    .innerJoin(postHashtags, eq(posts.id, postHashtags.postId))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = rawPosts.length > limit;
  const postsSlice = hasMore ? rawPosts.slice(0, limit) : rawPosts;
  const nextCursor = hasMore ? postsSlice[postsSlice.length - 1]!.createdAt.toISOString() : null;

  if (postsSlice.length === 0) {
    return { posts: [], nextCursor: null };
  }

  const postIds = postsSlice.map((p) => p.id);
  const authorIds = [...new Set(postsSlice.map((p) => p.authorId))];
  const collabIds = postsSlice.map((p) => p.collabUserId).filter(Boolean) as string[];
  const allUserIds = [...new Set([...authorIds, ...collabIds])];

  const [
    usersData,
    mediaData,
    linkPreviews,
    pollsData,
    reactionsData,
    commentCounts,
    shareCounts,
    userReactions,
    bookmarkedPostIds,
    pinnedPostIds,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(sql`${users.id} = ANY(${allUserIds})`),
    db
      .select()
      .from(postMedia)
      .where(sql`${postMedia.postId} = ANY(${postIds})`)
      .orderBy(postMedia.order),
    db
      .select()
      .from(postLinkPreviews)
      .where(sql`${postLinkPreviews.postId} = ANY(${postIds})`),
    db
      .select()
      .from(polls)
      .where(sql`${polls.postId} = ANY(${postIds})`),
    db
      .select({
        entityId: reactions.entityId,
        reactionType: reactions.reactionType,
        count: sql<number>`count(*)::int`,
      })
      .from(reactions)
      .where(and(sql`${reactions.entityId} = ANY(${postIds})`, eq(reactions.entityType, 'post')))
      .groupBy(reactions.entityId, reactions.reactionType),
    db
      .select({
        postId: comments.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(sql`${comments.postId} = ANY(${postIds})`)
      .groupBy(comments.postId),
    db
      .select({
        postId: shares.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(shares)
      .where(sql`${shares.postId} = ANY(${postIds})`)
      .groupBy(shares.postId),
    db
      .select({ entityId: reactions.entityId, reactionType: reactions.reactionType })
      .from(reactions)
      .where(
        and(
          sql`${reactions.entityId} = ANY(${postIds})`,
          eq(reactions.entityType, 'post'),
          eq(reactions.userId, userId),
        ),
      ),
    db
      .select({ postId: collectionItems.postId })
      .from(collectionItems)
      .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
      .where(and(eq(collections.userId, userId), sql`${collectionItems.postId} = ANY(${postIds})`)),
    db
      .select({ postId: pinnedPosts.postId })
      .from(pinnedPosts)
      .where(and(eq(pinnedPosts.userId, userId), sql`${pinnedPosts.postId} = ANY(${postIds})`)),
  ]);

  const userMap = new Map(usersData.map((u) => [u.id, u]));
  const mediaMap = new Map<string, typeof mediaData>();
  for (const m of mediaData) {
    const existing = mediaMap.get(m.postId) ?? [];
    existing.push(m);
    mediaMap.set(m.postId, existing);
  }
  const linkPreviewMap = new Map(linkPreviews.map((lp) => [lp.postId, lp]));
  const pollMap = new Map(pollsData.map((p) => [p.postId, p]));
  const reactionCountMap = new Map<string, Record<string, number>>();
  for (const r of reactionsData) {
    const existing = reactionCountMap.get(r.entityId) ?? {};
    existing[r.reactionType] = r.count;
    reactionCountMap.set(r.entityId, existing);
  }
  const commentCountMap = new Map(commentCounts.map((c) => [c.postId, c.count]));
  const shareCountMap = new Map(shareCounts.map((s) => [s.postId, s.count]));
  const userReactionMap = new Map(userReactions.map((r) => [r.entityId, r.reactionType]));
  const bookmarkedSet = new Set(bookmarkedPostIds.map((b) => b.postId));
  const pinnedSet = new Set(pinnedPostIds.map((p) => p.postId));

  let pollOptionsData: Array<{ id: string; pollId: string; text: string; order: number }> = [];
  let pollVotesData: Array<{ optionId: string; count: number }> = [];
  let userPollVotes: Array<{ optionId: string }> = [];

  const pollIds = pollsData.map((p) => p.id);
  if (pollIds.length > 0) {
    [pollOptionsData, pollVotesData, userPollVotes] = await Promise.all([
      db
        .select({
          id: pollOptions.id,
          pollId: pollOptions.pollId,
          text: pollOptions.text,
          order: pollOptions.order,
        })
        .from(pollOptions)
        .where(sql`${pollOptions.pollId} = ANY(${pollIds})`)
        .orderBy(pollOptions.order),
      db
        .select({
          optionId: pollVotes.optionId,
          count: sql<number>`count(*)::int`,
        })
        .from(pollVotes)
        .where(sql`${pollVotes.optionId} = ANY(${pollIds})`)
        .groupBy(pollVotes.optionId),
      db
        .select({ optionId: pollVotes.optionId })
        .from(pollVotes)
        .where(and(sql`${pollVotes.optionId} = ANY(${pollIds})`, eq(pollVotes.userId, userId))),
    ]);
  }

  const pollOptionsMap = new Map<string, typeof pollOptionsData>();
  for (const o of pollOptionsData) {
    const existing = pollOptionsMap.get(o.pollId) ?? [];
    existing.push(o);
    pollOptionsMap.set(o.pollId, existing);
  }
  const pollVoteCountMap = new Map(pollVotesData.map((v) => [v.optionId, v.count]));
  const userPollVoteSet = new Set(userPollVotes.map((v) => v.optionId));

  const feedPosts: FeedPost[] = postsSlice.map((post) => {
    const author = userMap.get(post.authorId)!;
    const collab = post.collabUserId ? (userMap.get(post.collabUserId) ?? null) : null;
    const pollData = pollMap.get(post.id);
    const opts = pollData ? (pollOptionsMap.get(pollData.id) ?? []) : [];
    const userVoted = opts.find((o) => userPollVoteSet.has(o.id));
    const lp = linkPreviewMap.get(post.id);

    return {
      id: post.id,
      content: post.content,
      visibility: post.visibility,
      contentWarning: post.contentWarning,
      slowModeSeconds: post.slowModeSeconds,
      isEdited: post.isEdited ?? false,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
      },
      collabUser: collab
        ? {
            id: collab.id,
            username: collab.username,
            displayName: collab.displayName,
            avatarUrl: collab.avatarUrl,
          }
        : null,
      media: (mediaMap.get(post.id) ?? []).map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        blurhash: m.blurhash,
        width: m.width,
        height: m.height,
        order: m.order,
      })),
      linkPreview: lp
        ? {
            url: lp.url,
            title: lp.title,
            description: lp.description,
            imageUrl: lp.imageUrl,
            siteName: lp.siteName,
          }
        : null,
      poll: pollData
        ? {
            id: pollData.id,
            question: pollData.question,
            expiresAt: pollData.expiresAt,
            options: opts.map((o) => ({
              id: o.id,
              text: o.text,
              voteCount: pollVoteCountMap.get(o.id) ?? 0,
            })),
            userVotedOptionId: userVoted?.id ?? null,
          }
        : null,
      reactionCounts: reactionCountMap.get(post.id) ?? {},
      userReaction: userReactionMap.get(post.id) ?? null,
      commentCount: commentCountMap.get(post.id) ?? 0,
      shareCount: shareCountMap.get(post.id) ?? 0,
      isBookmarked: bookmarkedSet.has(post.id),
      isPinned: pinnedSet.has(post.id),
    };
  });

  return { posts: feedPosts, nextCursor };
}
