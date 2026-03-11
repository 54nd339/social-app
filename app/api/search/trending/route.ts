import { NextResponse } from 'next/server';

import { getTrendingPosts } from '@/lib/db/queries/search.queries';

export async function GET() {
  const trending = await getTrendingPosts();
  return NextResponse.json(trending);
}
