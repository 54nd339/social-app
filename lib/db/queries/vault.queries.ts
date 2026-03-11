import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { vaultItems } from '@/lib/db/schema';

export interface VaultItemRow {
  id: string;
  encryptedContent: string;
  encryptedKey: string;
  type: string;
  createdAt: Date;
}

export async function getVaultItems(userId: string): Promise<VaultItemRow[]> {
  return db
    .select({
      id: vaultItems.id,
      encryptedContent: vaultItems.encryptedContent,
      encryptedKey: vaultItems.encryptedKey,
      type: vaultItems.type,
      createdAt: vaultItems.createdAt,
    })
    .from(vaultItems)
    .where(eq(vaultItems.userId, userId))
    .orderBy(desc(vaultItems.createdAt));
}
