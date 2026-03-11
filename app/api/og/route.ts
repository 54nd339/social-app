import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { scrapeOgData } from '@/lib/og-scraper';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const data = await scrapeOgData(url);
  if (!data) return NextResponse.json({ error: 'Could not fetch preview' }, { status: 422 });

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  });
}
