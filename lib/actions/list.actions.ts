'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { userListMembers, userLists } from '@/lib/db/schema';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

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
  await db
    .delete(userListMembers)
    .where(and(eq(userListMembers.listId, listId), eq(userListMembers.userId, userId)));

  return { success: true };
}
