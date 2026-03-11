import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { getVaultItems } from '@/lib/db/queries/vault.queries';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json([], { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json([], { status: 401 });

  const items = await getVaultItems(user.id);
  return NextResponse.json(items);
}
