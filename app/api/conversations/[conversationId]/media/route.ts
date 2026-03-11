import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getConversationMedia } from '@/lib/db/queries/media-gallery.queries';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { conversationId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '30');

  const result = await getConversationMedia(conversationId, cursor, limit);
  return NextResponse.json(result);
}
