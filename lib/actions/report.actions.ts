'use server';

import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { reports } from '@/lib/db/schema';

export async function submitReport(input: {
  entityId: string;
  entityType: 'post' | 'comment' | 'message' | 'user';
  reason: 'abuse' | 'spam' | 'harassment' | 'impersonation' | 'other';
  description?: string;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

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
