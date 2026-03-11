import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getPostsByHashtag } from '@/lib/db/queries/post.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET(req: Request, { params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const result = await getPostsByHashtag(tag, user.id, cursor);
  return NextResponse.json(result);
}
