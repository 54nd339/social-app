import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import {
  collectionItems,
  collections,
  comments,
  follows,
  messages,
  postMedia,
  posts,
  reactions,
  stories,
  users,
  vaultItems,
} from '@/lib/db/schema';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = user.id;

  const [
    userPosts,
    userComments,
    userReactions,
    userStories,
    userMessages,
    userFollowers,
    userFollowing,
    userCollections,
    userCollectionItems,
    userVaultItems,
    userPostMedia,
  ] = await Promise.all([
    db.select().from(posts).where(eq(posts.authorId, userId)),
    db.select().from(comments).where(eq(comments.authorId, userId)),
    db.select().from(reactions).where(eq(reactions.userId, userId)),
    db.select().from(stories).where(eq(stories.authorId, userId)),
    db.select().from(messages).where(eq(messages.senderId, userId)),
    db.select().from(follows).where(eq(follows.followingId, userId)),
    db.select().from(follows).where(eq(follows.followerId, userId)),
    db.select().from(collections).where(eq(collections.userId, userId)),
    db
      .select({ collectionId: collectionItems.collectionId, postId: collectionItems.postId })
      .from(collectionItems)
      .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
      .where(eq(collections.userId, userId)),
    db
      .select({ id: vaultItems.id, type: vaultItems.type, createdAt: vaultItems.createdAt })
      .from(vaultItems)
      .where(eq(vaultItems.userId, userId)),
    db
      .select({
        postId: postMedia.postId,
        url: postMedia.url,
        type: postMedia.type,
        order: postMedia.order,
      })
      .from(postMedia)
      .innerJoin(posts, eq(postMedia.postId, posts.id))
      .where(eq(posts.authorId, userId)),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      location: user.location,
      website: user.website,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      createdAt: user.createdAt,
    },
    posts: userPosts.map((p) => ({
      id: p.id,
      content: p.content,
      visibility: p.visibility,
      createdAt: p.createdAt,
      media: userPostMedia
        .filter((m) => m.postId === p.id)
        .map((m) => ({ url: m.url, type: m.type })),
    })),
    comments: userComments.map((c) => ({
      id: c.id,
      postId: c.postId,
      content: c.content,
      createdAt: c.createdAt,
    })),
    reactions: userReactions.map((r) => ({
      entityId: r.entityId,
      entityType: r.entityType,
      reactionType: r.reactionType,
    })),
    stories: userStories.map((s) => ({
      id: s.id,
      mediaUrl: s.mediaUrl,
      caption: s.caption,
      createdAt: s.createdAt,
    })),
    messages: userMessages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      content: m.content,
      type: m.type,
      mediaUrl: m.mediaUrl,
      createdAt: m.createdAt,
    })),
    followers: userFollowers.length,
    following: userFollowing.length,
    collections: userCollections.map((c) => ({
      name: c.name,
      items: userCollectionItems.filter((ci) => ci.collectionId === c.id).map((ci) => ci.postId),
    })),
    vaultItemCount: userVaultItems.length,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="haven-export-${user.username}-${Date.now()}.json"`,
    },
  });
}
