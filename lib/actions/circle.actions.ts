'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';

import { getAuthenticatedUser } from '@/lib/auth';
import { MAX_CIRCLE_MEMBERS } from '@/lib/constants';
import { db } from '@/lib/db';
import { circleMembers, circles } from '@/lib/db/schema';
import {
  addCircleMemberSchema,
  createCircleSchema,
  updateCircleSchema,
} from '@/lib/validators/circle';

export async function createCircle(input: { name: string; emoji?: string }) {
  const user = await getAuthenticatedUser();
  const { name, emoji } = createCircleSchema.parse(input);

  const [circle] = await db
    .insert(circles)
    .values({ ownerId: user.id, name, emoji: emoji ?? null })
    .returning({ id: circles.id });

  revalidatePath('/circles');
  return circle!;
}

export async function updateCircle(input: { circleId: string; name: string; emoji?: string }) {
  const user = await getAuthenticatedUser();
  const { circleId, name, emoji } = updateCircleSchema.parse(input);

  await db
    .update(circles)
    .set({ name, emoji: emoji ?? null })
    .where(and(eq(circles.id, circleId), eq(circles.ownerId, user.id)));

  revalidatePath('/circles');
  return { success: true };
}

export async function deleteCircle(circleId: string) {
  const user = await getAuthenticatedUser();

  await db.delete(circleMembers).where(eq(circleMembers.circleId, circleId));
  await db.delete(circles).where(and(eq(circles.id, circleId), eq(circles.ownerId, user.id)));

  revalidatePath('/circles');
  return { success: true };
}

export async function addCircleMember(input: { circleId: string; userId: string }) {
  const user = await getAuthenticatedUser();
  const { circleId, userId } = addCircleMemberSchema.parse(input);

  const [circle] = await db
    .select({ ownerId: circles.ownerId })
    .from(circles)
    .where(eq(circles.id, circleId))
    .limit(1);

  if (!circle || circle.ownerId !== user.id) throw new Error('Not authorized');

  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(circleMembers)
    .where(eq(circleMembers.circleId, circleId));

  if ((memberCount?.count ?? 0) >= MAX_CIRCLE_MEMBERS) {
    throw new Error(`Circle is full (max ${MAX_CIRCLE_MEMBERS} members)`);
  }

  const [existing] = await db
    .select({ id: circleMembers.id })
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
    .limit(1);

  if (existing) throw new Error('User already in this circle');

  await db.insert(circleMembers).values({ circleId, userId });

  revalidatePath('/circles');
  return { success: true };
}

export async function removeCircleMember(circleId: string, userId: string) {
  const user = await getAuthenticatedUser();

  const [circle] = await db
    .select({ ownerId: circles.ownerId })
    .from(circles)
    .where(eq(circles.id, circleId))
    .limit(1);

  if (!circle || circle.ownerId !== user.id) throw new Error('Not authorized');

  await db
    .delete(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));

  revalidatePath('/circles');
  return { success: true };
}
