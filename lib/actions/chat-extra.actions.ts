'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { conversations } from '@/lib/db/schema';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

export async function toggleMuteConversation(conversationId: string) {
  await getAuthenticatedUser();

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
  await getAuthenticatedUser();

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
  await getAuthenticatedUser();

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
  await getAuthenticatedUser();

  const { messages } = await import('@/lib/db/schema');

  await db
    .update(messages)
    .set({ isDeletedForEveryone: true, content: null, mediaUrl: null })
    .where(eq(messages.id, messageId));

  return { success: true };
}

export async function editMessage(messageId: string, newContent: string) {
  await getAuthenticatedUser();

  const { messageEditHistory, messages } = await import('@/lib/db/schema');

  const [msg] = await db
    .select({ content: messages.content })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) throw new Error('Message not found');

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
