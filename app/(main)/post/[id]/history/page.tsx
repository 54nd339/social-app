import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPostEditHistory } from '@/lib/db/queries/edit-history.queries';
import { formatRelativeTime } from '@/lib/utils';

interface EditHistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHistoryPage({ params }: EditHistoryPageProps) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) return notFound();

  const data = await getPostEditHistory(id);
  if (!data) return notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/post/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Edit History</h1>
      </div>

      <div className="p-4">
        <div className="mb-6 flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={data.author.avatarUrl ?? undefined} />
            <AvatarFallback>{data.author.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{data.author.displayName ?? data.author.username}</p>
            <p className="text-muted-foreground text-xs">@{data.author.username}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge>Current version</Badge>
              <span className="text-muted-foreground text-xs">
                {data.editedAt
                  ? `Edited ${formatRelativeTime(data.editedAt)}`
                  : formatRelativeTime(data.createdAt)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{data.content}</p>
          </div>

          {data.history.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4 opacity-70">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="text-muted-foreground size-3.5" />
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(entry.editedAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{entry.previousContent}</p>
            </div>
          ))}

          {data.history.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No edit history available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
