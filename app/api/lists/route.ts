import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserLists } from '@/lib/db/queries/list.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json([], { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json([], { status: 401 });

  const lists = await getUserLists(user.id);
  return NextResponse.json(lists);
}
