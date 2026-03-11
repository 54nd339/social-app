import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getCirclePosts } from '@/lib/db/queries/circle.queries';

export async function GET(req: Request, { params }: { params: Promise<{ circleId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { circleId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '20');

  const result = await getCirclePosts(circleId, cursor, limit);
  return NextResponse.json(result);
}
