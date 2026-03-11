import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { searchPosts, searchUsers } from '@/lib/db/queries/search.queries';
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
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type') ?? 'all';

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], posts: [] });
  }

  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);

  const [users, posts] = await Promise.all([
    type === 'posts' ? Promise.resolve([]) : searchUsers(q, user.id, limit),
    type === 'users' ? Promise.resolve([]) : searchPosts(q, limit),
  ]);

  return NextResponse.json({ users, posts });
}
