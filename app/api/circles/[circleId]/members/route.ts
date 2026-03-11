import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getCircleMembers } from '@/lib/db/queries/circle.queries';

export async function GET(_req: Request, { params }: { params: Promise<{ circleId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { circleId } = await params;
  const members = await getCircleMembers(circleId);
  return NextResponse.json(members);
}
