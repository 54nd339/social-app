import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { getCommentsForPost } from '@/lib/db/queries/comment.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { postId } = await params;
  const comments = await getCommentsForPost(postId, user.id);

  return NextResponse.json(comments);
}
