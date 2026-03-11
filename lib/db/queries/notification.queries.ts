import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';

export interface NotificationItem {
  id: string;
  type: string;
  entityId: string | null;
  entityType: string | null;
  read: boolean;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

export async function getNotifications(
  userId: string,
  cursor?: string,
  limit: number = 30,
): Promise<{ notifications: NotificationItem[]; nextCursor: string | null; unreadCount: number }> {
  const conditions = [eq(notifications.recipientId, userId)];

  if (cursor) {
    const { lt } = await import('drizzle-orm');
    conditions.push(lt(notifications.createdAt, new Date(cursor)));
  }

  const rawNotifs = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      entityId: notifications.entityId,
      entityType: notifications.entityType,
      read: notifications.read,
      createdAt: notifications.createdAt,
      actorId: notifications.actorId,
    })
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1);

  const hasMore = rawNotifs.length > limit;
  const sliced = hasMore ? rawNotifs.slice(0, limit) : rawNotifs;
  const nextCursor = hasMore ? sliced[sliced.length - 1]!.createdAt.toISOString() : null;

  const actorIds = [...new Set(sliced.map((n) => n.actorId).filter(Boolean))] as string[];
  let actorMap = new Map<
    string,
    { id: string; username: string; displayName: string | null; avatarUrl: string | null }
  >();

  if (actorIds.length > 0) {
    const actors = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(sql`${users.id} = ANY(${actorIds})`);

    actorMap = new Map(actors.map((a) => [a.id, a]));
  }

  const [unreadRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.recipientId, userId), eq(notifications.read, false)));

  const items: NotificationItem[] = sliced.map((n) => ({
    id: n.id,
    type: n.type,
    entityId: n.entityId,
    entityType: n.entityType,
    read: n.read,
    createdAt: n.createdAt,
    actor: n.actorId ? (actorMap.get(n.actorId) ?? null) : null,
  }));

  return { notifications: items, nextCursor, unreadCount: unreadRow?.count ?? 0 };
}

export async function markNotificationsRead(userId: string, notificationIds?: string[]) {
  if (notificationIds && notificationIds.length > 0) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.recipientId, userId),
          sql`${notifications.id} = ANY(${notificationIds})`,
        ),
      );
  } else {
    await db.update(notifications).set({ read: true }).where(eq(notifications.recipientId, userId));
  }
}
