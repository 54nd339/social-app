'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { vaultItems } from '@/lib/db/schema';

async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}

export async function createVaultItem(input: {
  encryptedContent: string;
  encryptedKey: string;
  type: 'note' | 'link' | 'media';
}) {
  const user = await getAuthenticatedUser();

  const [item] = await db
    .insert(vaultItems)
    .values({
      userId: user.id,
      encryptedContent: input.encryptedContent,
      encryptedKey: input.encryptedKey,
      type: input.type,
    })
    .returning({ id: vaultItems.id, createdAt: vaultItems.createdAt });

  revalidatePath('/vault');
  return item!;
}

export async function deleteVaultItem(itemId: string) {
  const user = await getAuthenticatedUser();

  await db.delete(vaultItems).where(and(eq(vaultItems.id, itemId), eq(vaultItems.userId, user.id)));

  revalidatePath('/vault');
  return { success: true };
}
