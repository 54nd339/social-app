import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { userListMembers, userLists, users } from '@/lib/db/schema';

export interface UserListWithCount {
  id: string;
  name: string;
  emoji: string | null;
  memberCount: number;
  createdAt: Date;
}

export interface ListMember {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export async function getUserLists(userId: string): Promise<UserListWithCount[]> {
  const raw = await db
    .select({
      id: userLists.id,
      name: userLists.name,
      emoji: userLists.emoji,
      createdAt: userLists.createdAt,
    })
    .from(userLists)
    .where(eq(userLists.ownerId, userId))
    .orderBy(userLists.createdAt);

  const counts = await Promise.all(
    raw.map(async (list) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(userListMembers)
        .where(eq(userListMembers.listId, list.id));
      return { id: list.id, count: row?.count ?? 0 };
    }),
  );

  const countMap = new Map(counts.map((c) => [c.id, c.count]));

  return raw.map((list) => ({
    id: list.id,
    name: list.name,
    emoji: list.emoji,
    memberCount: countMap.get(list.id) ?? 0,
    createdAt: list.createdAt,
  }));
}

export async function getListMembers(listId: string): Promise<ListMember[]> {
  const members = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(userListMembers)
    .innerJoin(users, eq(userListMembers.userId, users.id))
    .where(eq(userListMembers.listId, listId));

  return members;
}
