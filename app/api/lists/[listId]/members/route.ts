import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getListIfOwned, getListMembers } from '@/lib/db/queries/list.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const list = await getListIfOwned(listId, user.id);
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  const members = await getListMembers(listId);
  return NextResponse.json(members);
}
