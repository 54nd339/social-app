import { NextResponse } from 'next/server';
import { and, isNull, lt, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { stories, storyReactions, storyViews } from '@/lib/db/schema';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expired = await db
    .select({ id: stories.id })
    .from(stories)
    .where(and(lt(stories.expiresAt, new Date()), isNull(stories.highlightId)));

  if (expired.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const ids = expired.map((s) => s.id);

  await db.delete(storyViews).where(sql`${storyViews.storyId} = ANY(${ids})`);
  await db.delete(storyReactions).where(sql`${storyReactions.storyId} = ANY(${ids})`);
  await db.delete(stories).where(sql`${stories.id} = ANY(${ids})`);

  return NextResponse.json({ cleaned: ids.length });
}
