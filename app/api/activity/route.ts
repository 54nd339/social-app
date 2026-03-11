import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserActivity } from '@/lib/db/queries/activity.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ items: [], nextCursor: null }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ items: [], nextCursor: null }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;

  const data = await getUserActivity(user.id, cursor);
  return NextResponse.json(data);
}
