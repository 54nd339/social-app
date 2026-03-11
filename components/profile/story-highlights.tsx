'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createStoryHighlight, deleteStoryHighlight } from '@/lib/actions/profile-power.actions';
import type { StoryHighlightItem } from '@/lib/db/queries/profile-power.queries';

interface StoryHighlightsProps {
  highlights: StoryHighlightItem[];
  isSelf?: boolean;
}

export function StoryHighlights({ highlights, isSelf }: StoryHighlightsProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => createStoryHighlight(name),
    onSuccess: () => {
      toast.success('Highlight created');
      setCreateOpen(false);
      setName('');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Failed to create highlight'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteStoryHighlight(id),
    onSuccess: () => {
      toast.success('Highlight deleted');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Failed to delete highlight'),
  });

  if (highlights.length === 0 && !isSelf) return null;

  return (
    <>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-3">
        {isSelf && (
          <button
            className="flex flex-col items-center gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <div className="border-muted-foreground/30 flex size-16 items-center justify-center rounded-full border-2 border-dashed">
              <Plus className="text-muted-foreground size-5" />
            </div>
            <span className="text-muted-foreground max-w-16 truncate text-[10px]">New</span>
          </button>
        )}

        {highlights.map((hl) => (
          <div key={hl.id} className="group relative flex flex-col items-center gap-1.5">
            <div className="from-primary/40 to-primary/80 flex size-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br p-0.5">
              <div className="bg-background flex size-full items-center justify-center overflow-hidden rounded-full">
                {hl.coverUrl ? (
                  <Image
                    src={hl.coverUrl}
                    alt={hl.name}
                    width={56}
                    height={56}
                    className="size-full object-cover"
                  />
                ) : (
                  <Sparkles className="text-primary size-5" />
                )}
              </div>
            </div>
            <span className="max-w-16 truncate text-[10px] font-medium">{hl.name}</span>
            {isSelf && (
              <button
                onClick={() => remove(hl.id)}
                className="bg-destructive absolute -top-1 -right-1 hidden size-4 items-center justify-center rounded-full group-hover:flex"
              >
                <X className="size-2.5 text-white" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>New highlight</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) create();
            }}
            className="space-y-3"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Highlight name"
            />
            <Button type="submit" disabled={!name.trim() || isCreating} className="w-full">
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
