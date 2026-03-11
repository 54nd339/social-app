import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getNotifications } from '@/lib/db/queries/notification.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get('cursor') ?? undefined;

  const data = await getNotifications(user.id, cursor);
  return NextResponse.json(data);
}
