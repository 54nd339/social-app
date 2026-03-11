import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expired = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.isDisappearing, true),
        sql`${messages.createdAt} + (${messages.disappearSeconds} || ' seconds')::interval < NOW()`,
      ),
    );

  if (expired.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const ids = expired.map((m) => m.id);
  await db
    .update(messages)
    .set({ isDeletedForEveryone: true, content: null, mediaUrl: null, deletedAt: new Date() })
    .where(sql`${messages.id} = ANY(${ids})`);

  return NextResponse.json({ cleaned: ids.length });
}
