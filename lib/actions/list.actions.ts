'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { userListMembers, userLists } from '@/lib/db/schema';

export async function createList(name: string, emoji?: string) {
  const user = await getAuthenticatedUser();

  const [list] = await db
    .insert(userLists)
    .values({ ownerId: user.id, name, emoji: emoji ?? null })
    .returning({ id: userLists.id });

  revalidatePath('/lists');
  return list!;
}

export async function updateList(listId: string, name: string, emoji?: string) {
  const user = await getAuthenticatedUser();

  await db
    .update(userLists)
    .set({ name, emoji: emoji ?? null })
    .where(and(eq(userLists.id, listId), eq(userLists.ownerId, user.id)));

  revalidatePath('/lists');
  return { success: true };
}

export async function deleteList(listId: string) {
  const user = await getAuthenticatedUser();

  await db.delete(userListMembers).where(eq(userListMembers.listId, listId));
  await db.delete(userLists).where(and(eq(userLists.id, listId), eq(userLists.ownerId, user.id)));

  revalidatePath('/lists');
  return { success: true };
}

export async function addToList(listId: string, userId: string) {
  const user = await getAuthenticatedUser();

  const [list] = await db
    .select({ id: userLists.id })
    .from(userLists)
    .where(and(eq(userLists.id, listId), eq(userLists.ownerId, user.id)))
    .limit(1);

  if (!list) throw new Error('List not found');

  await db.insert(userListMembers).values({ listId, userId }).onConflictDoNothing();

  return { success: true };
}

export async function removeFromList(listId: string, userId: string) {
  const user = await getAuthenticatedUser();

  const [list] = await db
    .select({ id: userLists.id })
    .from(userLists)
    .where(and(eq(userLists.id, listId), eq(userLists.ownerId, user.id)))
    .limit(1);

  if (!list) throw new Error('List not found');

  await db
    .delete(userListMembers)
    .where(and(eq(userListMembers.listId, listId), eq(userListMembers.userId, userId)));

  return { success: true };
}
