import { NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memoryCandidates = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.isDraft, false),
        isNull(posts.scheduledAt),
        sql`EXTRACT(MONTH FROM ${posts.createdAt}) = EXTRACT(MONTH FROM NOW())`,
        sql`EXTRACT(DAY FROM ${posts.createdAt}) = EXTRACT(DAY FROM NOW())`,
        sql`EXTRACT(YEAR FROM ${posts.createdAt}) < EXTRACT(YEAR FROM NOW())`,
      ),
    );

  return NextResponse.json({
    surfaced: memoryCandidates.length,
    memories: memoryCandidates.map((m) => ({
      postId: m.id,
      authorId: m.authorId,
      originalDate: m.createdAt,
    })),
  });
}
