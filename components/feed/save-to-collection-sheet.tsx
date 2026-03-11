'use client';

import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { saveToCollection } from '@/lib/actions/collection.actions';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
  emoji: string | null;
  isDefault: boolean;
}

interface SaveToCollectionSheetProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveToCollectionSheet({ postId, open, onOpenChange }: SaveToCollectionSheetProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: collections, isLoading } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await fetch('/api/collections');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => saveToCollection(postId, selectedId ?? undefined),
    onSuccess: (result) => {
      toast.success(result.saved ? 'Saved to collection' : 'Removed from collection');
      onOpenChange(false);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-4" />
            Save to collection
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            : collections?.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedId(col.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                    selectedId === col.id
                      ? 'bg-primary/10 text-primary border-primary border'
                      : 'hover:bg-accent border border-transparent',
                  )}
                >
                  <span className="text-lg">{col.emoji ?? '📁'}</span>
                  <span className="flex-1 truncate font-medium">{col.name}</span>
                  {col.isDefault && <span className="text-muted-foreground text-xs">Default</span>}
                </button>
              ))}
        </div>
        <Button onClick={() => save()} disabled={!selectedId || isPending} className="w-full">
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
