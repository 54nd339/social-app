'use server';

import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { reports } from '@/lib/db/schema';

export async function submitReport(input: {
  entityId: string;
  entityType: 'post' | 'comment' | 'message' | 'user';
  reason: 'abuse' | 'spam' | 'harassment' | 'impersonation' | 'other';
  description?: string;
}) {
  const user = await getAuthenticatedUser();

  const [report] = await db
    .insert(reports)
    .values({
      reporterId: user.id,
      entityId: input.entityId,
      entityType: input.entityType,
      reason: input.reason,
      description: input.description ?? null,
    })
    .returning({ id: reports.id });

  return { id: report!.id };
}
