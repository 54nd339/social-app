import { auth } from '@clerk/nextjs/server';

import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found');

  return user;
}
