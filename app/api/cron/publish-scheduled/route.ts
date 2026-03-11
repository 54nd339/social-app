import { NextResponse } from 'next/server';
import { and, eq, isNotNull, lt } from 'drizzle-orm';

import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const scheduled = await db
    .update(posts)
    .set({ scheduledAt: null, isDraft: false })
    .where(and(isNotNull(posts.scheduledAt), lt(posts.scheduledAt, now), eq(posts.isDraft, true)))
    .returning({ id: posts.id });

  const timeCapsules = await db
    .update(posts)
    .set({ timeCapsuleAt: null, isDraft: false })
    .where(
      and(isNotNull(posts.timeCapsuleAt), lt(posts.timeCapsuleAt, now), eq(posts.isDraft, true)),
    )
    .returning({ id: posts.id });

  return NextResponse.json({
    published: scheduled.length,
    timeCapsules: timeCapsules.length,
  });
}
