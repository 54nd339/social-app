'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversationMembers, conversations, messageEditHistory, messages } from '@/lib/db/schema';

async function assertConversationMember(conversationId: string, userId: string): Promise<void> {
  const [member] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!member) throw new Error('Not a member of this conversation');
}

export async function toggleMuteConversation(conversationId: string) {
  const user = await getAuthenticatedUser();
  await assertConversationMember(conversationId, user.id);

  const [conv] = await db
    .select({ isMuted: conversations.isMuted })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) throw new Error('Conversation not found');

  await db
    .update(conversations)
    .set({ isMuted: !conv.isMuted })
    .where(eq(conversations.id, conversationId));

  revalidatePath('/messages');
  return { muted: !conv.isMuted };
}

export async function toggleArchiveConversation(conversationId: string) {
  const user = await getAuthenticatedUser();
  await assertConversationMember(conversationId, user.id);

  const [conv] = await db
    .select({ isArchived: conversations.isArchived })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) throw new Error('Conversation not found');

  await db
    .update(conversations)
    .set({ isArchived: !conv.isArchived })
    .where(eq(conversations.id, conversationId));

  revalidatePath('/messages');
  return { archived: !conv.isArchived };
}

export async function togglePinConversation(conversationId: string) {
  const user = await getAuthenticatedUser();
  await assertConversationMember(conversationId, user.id);

  const [conv] = await db
    .select({ isPinned: conversations.isPinned })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv) throw new Error('Conversation not found');

  await db
    .update(conversations)
    .set({ isPinned: !conv.isPinned })
    .where(eq(conversations.id, conversationId));

  revalidatePath('/messages');
  return { pinned: !conv.isPinned };
}

export async function deleteMessageForEveryone(messageId: string) {
  const user = await getAuthenticatedUser();

  const [msg] = await db
    .select({ senderId: messages.senderId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) throw new Error('Message not found');
  if (msg.senderId !== user.id) throw new Error('Not authorized');

  await db
    .update(messages)
    .set({ isDeletedForEveryone: true, content: null, mediaUrl: null })
    .where(eq(messages.id, messageId));

  return { success: true };
}

export async function editMessage(messageId: string, newContent: string) {
  const user = await getAuthenticatedUser();

  const [msg] = await db
    .select({ content: messages.content, senderId: messages.senderId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) throw new Error('Message not found');
  if (msg.senderId !== user.id) throw new Error('Not authorized');

  if (msg.content) {
    await db.insert(messageEditHistory).values({
      messageId,
      previousContent: msg.content,
    });
  }

  await db
    .update(messages)
    .set({ content: newContent, isEdited: true, editedAt: new Date() })
    .where(eq(messages.id, messageId));

  return { success: true };
}
