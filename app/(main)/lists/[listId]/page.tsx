import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import { ListDetail } from '@/components/lists/list-detail';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

export const metadata: Metadata = { title: 'List' };

interface ListPageProps {
  params: Promise<{ listId: string }>;
}

export default async function ListDetailPage({ params }: ListPageProps) {
  const { listId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return notFound();

  const user = await getUserByClerkId(clerkId);
  if (!user) return notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <ListDetail listId={listId} />
    </div>
  );
}
