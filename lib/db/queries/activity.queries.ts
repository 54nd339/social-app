import { desc, eq, lt, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';

export interface ActivityItem {
  id: string;
  action: string;
  entityId: string;
  entityType: string;
  createdAt: Date;
}

export async function getUserActivity(
  userId: string,
  cursor?: string,
  limit: number = 30,
): Promise<{ items: ActivityItem[]; nextCursor: string | null }> {
  const conditions = [eq(activityLog.userId, userId)];
  if (cursor) {
    conditions.push(lt(activityLog.createdAt, new Date(cursor)));
  }

  const rows = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      entityId: activityLog.entityId,
      entityType: activityLog.entityType,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .where(
      sql`${conditions.reduce((acc, c, i) => (i === 0 ? c : sql`${acc} AND ${c}`), conditions[0]!)}`,
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? sliced[sliced.length - 1]!.createdAt.toISOString() : null;

  return { items: sliced, nextCursor };
}
