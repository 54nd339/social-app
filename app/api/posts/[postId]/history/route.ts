import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getPostEditHistory } from '@/lib/db/queries/edit-history.queries';

export async function GET(_req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await params;
  const data = await getPostEditHistory(postId);
  if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  return NextResponse.json(data);
}
