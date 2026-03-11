'use client';

import { Calendar, Clock, FileEdit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { deletePost } from '@/lib/actions/post.actions';
import type { DraftPost } from '@/lib/db/queries/draft.queries';
import { formatRelativeTime, truncate } from '@/lib/utils';

interface DraftsResponse {
  drafts: DraftPost[];
  scheduled: DraftPost[];
}

async function fetchDrafts(): Promise<DraftsResponse> {
  const res = await fetch('/api/drafts');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

function DraftCard({ draft, onDelete }: { draft: DraftPost; onDelete: () => void }) {
  return (
    <div className="group flex items-start gap-3 border-b px-4 py-3">
      <FileEdit className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">{truncate(draft.content, 200)}</p>
        <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatRelativeTime(draft.updatedAt)}
          </span>
          {draft.scheduledAt && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(draft.scheduledAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 opacity-0 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 className="text-destructive size-3.5" />
      </Button>
    </div>
  );
}

export function DraftList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drafts'],
    queryFn: fetchDrafts,
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Draft deleted');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const drafts = data?.drafts ?? [];
  const scheduled = data?.scheduled ?? [];

  return (
    <Tabs defaultValue="drafts" className="p-4">
      <TabsList className="w-full">
        <TabsTrigger value="drafts" className="flex-1">
          Drafts ({drafts.length})
        </TabsTrigger>
        <TabsTrigger value="scheduled" className="flex-1">
          Scheduled ({scheduled.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="drafts" className="mt-4">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileEdit className="text-muted-foreground/40 size-10" />
            <h3 className="text-sm font-semibold">No drafts</h3>
            <p className="text-muted-foreground text-xs">Unfinished posts will appear here</p>
          </div>
        ) : (
          <div className="-mx-4 divide-y">
            {drafts.map((d) => (
              <DraftCard key={d.id} draft={d} onDelete={() => remove(d.id)} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="scheduled" className="mt-4">
        {scheduled.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Calendar className="text-muted-foreground/40 size-10" />
            <h3 className="text-sm font-semibold">Nothing scheduled</h3>
            <p className="text-muted-foreground text-xs">
              Schedule posts from the composer to see them here
            </p>
          </div>
        ) : (
          <div className="-mx-4 divide-y">
            {scheduled.map((d) => (
              <DraftCard key={d.id} draft={d} onDelete={() => remove(d.id)} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
