import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserCollections } from '@/lib/db/queries/collection.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json([], { status: 401 });

  const user = await getUserByClerkId(clerkId);
  if (!user) return NextResponse.json([], { status: 401 });

  const collections = await getUserCollections(user.id);
  return NextResponse.json(collections);
}
