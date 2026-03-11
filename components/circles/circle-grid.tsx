'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleDashed, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { createCircle, deleteCircle } from '@/lib/actions/circle.actions';
import { useCircles } from '@/hooks/use-circles';

function CircleSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function CircleGrid() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  const { data: circleList, isLoading } = useCircles();

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => createCircle({ name, emoji: emoji || undefined }),
    onSuccess: () => {
      setOpen(false);
      setName('');
      setEmoji('');
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Circle created');
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteCircle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Circle deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CircleSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {circleList?.map((circle) => (
          <div
            key={circle.id}
            className="group hover:bg-accent/50 relative flex items-center gap-3 rounded-lg border p-4 transition-colors"
          >
            <Link href={`/circles/${circle.id}`} className="absolute inset-0 z-0" />

            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full text-lg">
              {circle.emoji ?? '🔵'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{circle.name}</p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Users className="size-3" />
                {circle.memberCount} {circle.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              className="relative z-10 opacity-0 group-hover:opacity-100"
              onClick={() => remove(circle.id)}
            >
              <Trash2 className="text-destructive size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {(!circleList || circleList.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <CircleDashed className="text-muted-foreground/40 size-10" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">No circles yet</h3>
            <p className="text-muted-foreground text-xs">
              Create circles to share content with specific groups
            </p>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-4" />
            New circle
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New circle</DialogTitle>
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
              placeholder="Circle name"
            />
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Emoji (optional)"
              maxLength={2}
              className="w-20"
            />
            <Button type="submit" disabled={!name.trim() || isCreating} className="w-full">
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
