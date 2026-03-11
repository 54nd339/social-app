import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { Webhook } from 'svix';

import { db } from '@/lib/db';
import { collections, users } from '@/lib/db/schema';
import { env } from '@/lib/env';

interface ClerkUserPayload {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let event: { type: string; data: ClerkUserPayload };

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event;
  } catch {
    return new Response('Invalid webhook signature', { status: 400 });
  }

  const { type, data } = event;

  if (type === 'user.created') {
    const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: data.id,
        username: data.username ?? data.id,
        displayName,
        email: data.email_addresses[0]?.email_address ?? '',
        avatarUrl: data.image_url,
      })
      .returning();

    if (newUser) {
      await db.insert(collections).values({
        userId: newUser.id,
        name: 'Saved',
        isDefault: true,
        order: 0,
      });
    }
  }

  if (type === 'user.updated') {
    const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined;

    await db
      .update(users)
      .set({
        username: data.username ?? undefined,
        displayName,
        email: data.email_addresses[0]?.email_address,
        avatarUrl: data.image_url ?? undefined,
      })
      .where(eq(users.clerkId, data.id));
  }

  if (type === 'user.deleted') {
    await db.delete(users).where(eq(users.clerkId, data.id));
  }

  return new Response('OK', { status: 200 });
}
