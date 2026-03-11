'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, FolderHeart, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
import {
  createCollection,
  deleteCollection,
  updateCollection,
} from '@/lib/actions/collection.actions';
import type { CollectionWithCount } from '@/lib/db/queries/collection.queries';

async function fetchCollections(): Promise<CollectionWithCount[]> {
  const res = await fetch('/api/collections');
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
}

function CollectionSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function CollectionGrid() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const { data: cols, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => createCollection(name, emoji || undefined),
    onSuccess: () => {
      setOpen(false);
      setName('');
      setEmoji('');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created');
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: () => updateCollection(editId!, editName, editEmoji || undefined),
    onSuccess: () => {
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CollectionSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {cols?.map((col) => (
          <div
            key={col.id}
            className="group hover:bg-accent/50 relative flex items-center gap-3 rounded-lg border p-4 transition-colors"
          >
            <Link href={`/collections/${col.id}`} className="absolute inset-0 z-0" />

            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-md text-lg">
              {col.emoji ?? '📂'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{col.name}</p>
              <p className="text-muted-foreground text-xs">
                {col.itemCount} {col.itemCount === 1 ? 'post' : 'posts'}
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setEditId(col.id);
                  setEditName(col.name);
                  setEditEmoji(col.emoji ?? '');
                  setEditOpen(true);
                }}
              >
                <Edit2 className="size-3.5" />
              </Button>
              {!col.isDefault && (
                <Button variant="ghost" size="icon-sm" onClick={() => remove(col.id)}>
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!cols || cols.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FolderHeart className="text-muted-foreground/40 size-10" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">No collections yet</h3>
            <p className="text-muted-foreground text-xs">Save posts into organized collections</p>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-4" />
            New collection
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
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
              placeholder="Collection name"
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editName.trim()) update();
            }}
            className="space-y-3"
          >
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Collection name"
            />
            <Input
              value={editEmoji}
              onChange={(e) => setEditEmoji(e.target.value)}
              placeholder="Emoji (optional)"
              maxLength={2}
              className="w-20"
            />
            <Button type="submit" disabled={!editName.trim() || isUpdating} className="w-full">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
