import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getScheduledPosts, getUserDrafts } from '@/lib/db/queries/draft.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ drafts: [], scheduled: [] }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ drafts: [], scheduled: [] }, { status: 401 });

  const [drafts, scheduled] = await Promise.all([
    getUserDrafts(user.id),
    getScheduledPosts(user.id),
  ]);

  return NextResponse.json({ drafts, scheduled });
}
