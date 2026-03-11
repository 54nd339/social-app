import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { pusherServer } from '@/lib/pusher/server';

export async function createNotification(input: {
  recipientId: string;
  actorId: string;
  type: string;
  entityId: string;
  entityType: string;
}) {
  if (input.recipientId === input.actorId) return;

  const [notif] = await db
    .insert(notifications)
    .values({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      entityId: input.entityId,
      entityType: input.entityType,
    })
    .returning({ id: notifications.id, createdAt: notifications.createdAt });

  await pusherServer
    .trigger(`private-user-${input.recipientId}`, 'new-notification', {
      id: notif!.id,
      type: input.type,
      actorId: input.actorId,
      entityId: input.entityId,
      entityType: input.entityType,
      createdAt: notif!.createdAt,
    })
    .catch(() => {});
}
