import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';

import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';
import { circles } from '@/lib/db/schema';

import { CircleDetailView } from './circle-detail-view';

interface CirclePageProps {
  params: Promise<{ circleId: string }>;
}

export default async function CirclePage({ params }: CirclePageProps) {
  const { circleId } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId) return notFound();

  const user = await getUserByClerkId(clerkId);
  if (!user) return notFound();

  const [circle] = await db
    .select({ id: circles.id, name: circles.name, emoji: circles.emoji, ownerId: circles.ownerId })
    .from(circles)
    .where(and(eq(circles.id, circleId), eq(circles.ownerId, user.id)))
    .limit(1);

  if (!circle) return notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/circles">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg">{circle.emoji ?? '🔵'}</span>
          <h1 className="text-lg font-semibold">{circle.name}</h1>
        </div>
      </div>
      <CircleDetailView circleId={circleId} />
    </div>
  );
}
