import { NextRequest, NextResponse } from 'next/server';

import { getCollectionPosts } from '@/lib/db/queries/collection.queries';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  const { collectionId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') ?? undefined;

  const data = await getCollectionPosts(collectionId, cursor);
  return NextResponse.json(data);
}
