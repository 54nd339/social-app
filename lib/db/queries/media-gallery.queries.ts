import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { messages, users } from '@/lib/db/schema';

export interface MediaItem {
  id: string;
  type: string;
  mediaUrl: string;
  fileName: string | null;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string | null;
  createdAt: Date;
}

export async function getConversationMedia(
  conversationId: string,
  cursor?: string,
  limit: number = 30,
): Promise<{ items: MediaItem[]; nextCursor: string | null }> {
  const mediaTypes = ['image', 'gif', 'doc', 'voice'];

  const conditions = [
    eq(messages.conversationId, conversationId),
    sql`${messages.type} = ANY(${mediaTypes})`,
    sql`${messages.mediaUrl} IS NOT NULL`,
    eq(messages.isDeletedForEveryone, false),
  ];

  if (cursor) {
    conditions.push(sql`${messages.createdAt} < ${new Date(cursor)}`);
  }

  const rows = await db
    .select({
      id: messages.id,
      type: messages.type,
      mediaUrl: messages.mediaUrl,
      fileName: messages.fileName,
      senderId: messages.senderId,
      senderUsername: users.username,
      senderDisplayName: users.displayName,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? sliced[sliced.length - 1]!.createdAt.toISOString() : null;

  return {
    items: sliced.map((r) => ({
      id: r.id,
      type: r.type,
      mediaUrl: r.mediaUrl!,
      fileName: r.fileName,
      senderId: r.senderId,
      senderUsername: r.senderUsername,
      senderDisplayName: r.senderDisplayName,
      createdAt: r.createdAt,
    })),
    nextCursor,
  };
}
