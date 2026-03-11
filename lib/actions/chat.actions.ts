'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversationMembers, conversations, messages } from '@/lib/db/schema';
import { pusherServer } from '@/lib/pusher/server';

export async function createConversation(otherUserId: string) {
  const user = await getAuthenticatedUser();
  if (user.id === otherUserId) throw new Error('Cannot message yourself');

  const existing = await db
    .select({ conversationId: conversationMembers.conversationId })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversationMembers.conversationId, conversations.id))
    .where(and(eq(conversationMembers.userId, user.id), eq(conversations.type, 'direct')));

  for (const row of existing) {
    const [other] = await db
      .select({ userId: conversationMembers.userId })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, row.conversationId),
          eq(conversationMembers.userId, otherUserId),
        ),
      )
      .limit(1);

    if (other) {
      return { conversationId: row.conversationId, isNew: false };
    }
  }

  const [conv] = await db
    .insert(conversations)
    .values({
      type: 'direct',
      createdBy: user.id,
    })
    .returning({ id: conversations.id });

  await db.insert(conversationMembers).values([
    { conversationId: conv!.id, userId: user.id, role: 'member' },
    { conversationId: conv!.id, userId: otherUserId, role: 'member' },
  ]);

  revalidatePath('/messages');
  return { conversationId: conv!.id, isNew: true };
}

export async function sendMessage(input: {
  conversationId: string;
  content?: string;
  type?: string;
  mediaUrl?: string;
  fileName?: string;
  replyToId?: string;
  isDisappearing?: boolean;
  disappearSeconds?: number;
  isViewOnce?: boolean;
}) {
  const user = await getAuthenticatedUser();

  const [membership] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, input.conversationId),
        eq(conversationMembers.userId, user.id),
      ),
    )
    .limit(1);

  if (!membership) throw new Error('Not a member of this conversation');

  const [message] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      senderId: user.id,
      content: input.content ?? null,
      type: input.type ?? 'text',
      mediaUrl: input.mediaUrl ?? null,
      fileName: input.fileName ?? null,
      replyToId: input.replyToId ?? null,
      isDisappearing: input.isDisappearing ?? false,
      disappearSeconds: input.disappearSeconds ?? null,
      isViewOnce: input.isViewOnce ?? false,
    })
    .returning({ id: messages.id, createdAt: messages.createdAt });

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));

  const messagePayload = {
    id: message!.id,
    createdAt: message!.createdAt,
    content: input.content ?? null,
    type: input.type ?? 'text',
    mediaUrl: input.mediaUrl ?? null,
    sender: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  };

  await pusherServer.trigger(
    `private-conversation-${input.conversationId}`,
    'new-message',
    messagePayload,
  );

  return messagePayload;
}

export async function markConversationRead(conversationId: string) {
  const user = await getAuthenticatedUser();

  await db
    .update(conversationMembers)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, user.id),
      ),
    );

  return { success: true };
}
