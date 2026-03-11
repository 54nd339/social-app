'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { collectionItems, collections } from '@/lib/db/schema';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

export async function createCollection(name: string, emoji?: string) {
  const user = await getAuthenticatedUser();

  const [collection] = await db
    .insert(collections)
    .values({ userId: user.id, name, emoji: emoji ?? null })
    .returning({ id: collections.id });

  revalidatePath('/collections');
  return collection!;
}

export async function updateCollection(collectionId: string, name: string, emoji?: string) {
  const user = await getAuthenticatedUser();

  await db
    .update(collections)
    .set({ name, emoji: emoji ?? null })
    .where(and(eq(collections.id, collectionId), eq(collections.userId, user.id)));

  revalidatePath('/collections');
  return { success: true };
}

export async function deleteCollection(collectionId: string) {
  const user = await getAuthenticatedUser();

  const [col] = await db
    .select({ isDefault: collections.isDefault })
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, user.id)))
    .limit(1);

  if (col?.isDefault) throw new Error('Cannot delete the default collection');

  await db.delete(collectionItems).where(eq(collectionItems.collectionId, collectionId));
  await db
    .delete(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, user.id)));

  revalidatePath('/collections');
  return { success: true };
}

export async function saveToCollection(postId: string, collectionId?: string) {
  const user = await getAuthenticatedUser();

  let targetId = collectionId;

  if (!targetId) {
    const [defaultCol] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.userId, user.id), eq(collections.isDefault, true)))
      .limit(1);

    if (!defaultCol) {
      const [newDefault] = await db
        .insert(collections)
        .values({ userId: user.id, name: 'Saved', isDefault: true })
        .returning({ id: collections.id });
      targetId = newDefault!.id;
    } else {
      targetId = defaultCol.id;
    }
  }

  const [existing] = await db
    .select({ id: collectionItems.id })
    .from(collectionItems)
    .where(and(eq(collectionItems.collectionId, targetId), eq(collectionItems.postId, postId)))
    .limit(1);

  if (existing) {
    await db.delete(collectionItems).where(eq(collectionItems.id, existing.id));
    return { saved: false };
  }

  await db.insert(collectionItems).values({ collectionId: targetId, postId });
  return { saved: true };
}

export async function removeFromCollection(collectionId: string, postId: string) {
  await db
    .delete(collectionItems)
    .where(and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.postId, postId)));

  revalidatePath('/collections');
  return { success: true };
}
