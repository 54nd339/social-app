import { and, desc, eq, lt, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { conversationMembers, conversations, messages, users } from '@/lib/db/schema';

export interface ConversationPreview {
  id: string;
  type: string;
  name: string | null;
  avatarUrl: string | null;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  updatedAt: Date;
  lastMessage: {
    content: string | null;
    type: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  } | null;
  otherUser: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  content: string | null;
  type: string;
  mediaUrl: string | null;
  fileName: string | null;
  isDisappearing: boolean;
  isViewOnce: boolean;
  isEdited: boolean;
  isDeletedForEveryone: boolean;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  replyToId: string | null;
}

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const memberships = await db
    .select({
      conversationId: conversationMembers.conversationId,
      lastReadAt: conversationMembers.lastReadAt,
    })
    .from(conversationMembers)
    .where(eq(conversationMembers.userId, userId));

  if (memberships.length === 0) return [];

  const convIds = memberships.map((m) => m.conversationId);
  const lastReadMap = new Map(memberships.map((m) => [m.conversationId, m.lastReadAt]));

  const convs = await db
    .select()
    .from(conversations)
    .where(sql`${conversations.id} = ANY(${convIds})`)
    .orderBy(desc(conversations.updatedAt));

  const allMembers = await db
    .select({
      conversationId: conversationMembers.conversationId,
      userId: conversationMembers.userId,
    })
    .from(conversationMembers)
    .where(sql`${conversationMembers.conversationId} = ANY(${convIds})`);

  const otherUserIds = new Set<string>();
  const convOtherUserMap = new Map<string, string>();

  for (const m of allMembers) {
    if (m.userId !== userId) {
      otherUserIds.add(m.userId);
      convOtherUserMap.set(m.conversationId, m.userId);
    }
  }

  const otherUsersData =
    otherUserIds.size > 0
      ? await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(sql`${users.id} = ANY(${[...otherUserIds]})`)
      : [];

  const userMap = new Map(otherUsersData.map((u) => [u.id, u]));

  const lastMessages = await Promise.all(
    convIds.map(async (convId) => {
      const [msg] = await db
        .select({
          content: messages.content,
          type: messages.type,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      return { convId, msg: msg ?? null };
    }),
  );

  const lastMsgMap = new Map(lastMessages.map((l) => [l.convId, l.msg]));

  const unreadCounts = await Promise.all(
    convIds.map(async (convId) => {
      const lastRead = lastReadMap.get(convId);
      const conditions = [
        eq(messages.conversationId, convId),
        sql`${messages.senderId} != ${userId}`,
      ];
      if (lastRead) conditions.push(sql`${messages.createdAt} > ${lastRead}`);

      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(...conditions));
      return { convId, count: row?.count ?? 0 };
    }),
  );

  const unreadMap = new Map(unreadCounts.map((u) => [u.convId, u.count]));

  return convs.map((conv) => {
    const otherUserId = convOtherUserMap.get(conv.id);
    const otherUser = otherUserId ? (userMap.get(otherUserId) ?? null) : null;
    const lastMsg = lastMsgMap.get(conv.id);
    const senderUser = lastMsg ? userMap.get(lastMsg.senderId) : null;

    return {
      id: conv.id,
      type: conv.type,
      name: conv.name,
      avatarUrl: conv.avatarUrl,
      isPinned: conv.isPinned ?? false,
      isMuted: conv.isMuted ?? false,
      isArchived: conv.isArchived ?? false,
      updatedAt: conv.updatedAt,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            type: lastMsg.type,
            senderId: lastMsg.senderId,
            senderName: senderUser?.displayName ?? senderUser?.username ?? 'Unknown',
            createdAt: lastMsg.createdAt,
          }
        : null,
      otherUser,
      unreadCount: unreadMap.get(conv.id) ?? 0,
    };
  });
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit: number = 50,
): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> {
  const conditions = [eq(messages.conversationId, conversationId)];
  if (cursor) conditions.push(lt(messages.createdAt, new Date(cursor)));

  const rawMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
      type: messages.type,
      mediaUrl: messages.mediaUrl,
      fileName: messages.fileName,
      isDisappearing: messages.isDisappearing,
      isViewOnce: messages.isViewOnce,
      isEdited: messages.isEdited,
      isDeletedForEveryone: messages.isDeletedForEveryone,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      replyToId: messages.replyToId,
    })
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1);

  const hasMore = rawMessages.length > limit;
  const sliced = hasMore ? rawMessages.slice(0, limit) : rawMessages;
  const nextCursor = hasMore ? sliced[sliced.length - 1]!.createdAt.toISOString() : null;

  const senderIds = [...new Set(sliced.map((m) => m.senderId))];
  const sendersData =
    senderIds.length > 0
      ? await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(sql`${users.id} = ANY(${senderIds})`)
      : [];

  const senderMap = new Map(sendersData.map((u) => [u.id, u]));

  const chatMessages: ChatMessage[] = sliced.reverse().map((m) => ({
    id: m.id,
    content: m.content,
    type: m.type,
    mediaUrl: m.mediaUrl,
    fileName: m.fileName,
    isDisappearing: m.isDisappearing ?? false,
    isViewOnce: m.isViewOnce ?? false,
    isEdited: m.isEdited ?? false,
    isDeletedForEveryone: m.isDeletedForEveryone ?? false,
    createdAt: m.createdAt,
    sender: senderMap.get(m.senderId)!,
    replyToId: m.replyToId,
  }));

  return { messages: chatMessages, nextCursor };
}
