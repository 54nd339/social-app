import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getSuggestedUsers } from '@/lib/db/queries/search.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const suggestions = await getSuggestedUsers(user.id);
  return NextResponse.json(suggestions);
}
