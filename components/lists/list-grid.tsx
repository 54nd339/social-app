'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, List, Plus, Trash2 } from 'lucide-react';
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
import { createList, deleteList, updateList } from '@/lib/actions/list.actions';
import type { UserListWithCount } from '@/lib/db/queries/list.queries';

async function fetchLists(): Promise<UserListWithCount[]> {
  const res = await fetch('/api/lists');
  if (!res.ok) throw new Error('Failed to fetch lists');
  return res.json();
}

export function ListGrid() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [editListId, setEditListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const { data: lists, isLoading } = useQuery({
    queryKey: ['user-lists'],
    queryFn: fetchLists,
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => createList(name, emoji || undefined),
    onSuccess: () => {
      setOpen(false);
      setName('');
      setEmoji('');
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
      toast.success('List created');
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
      toast.success('List deleted');
    },
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ listId, name, emoji }: { listId: string; name: string; emoji?: string }) =>
      updateList(listId, name, emoji || undefined),
    onSuccess: () => {
      setEditListId(null);
      setEditName('');
      setEditEmoji('');
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
      toast.success('List updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {lists?.map((list) => (
          <div
            key={list.id}
            className="group hover:bg-accent/50 relative flex items-center gap-3 rounded-lg border p-4 transition-colors"
          >
            <Link href={`/lists/${list.id}`} className="absolute inset-0 z-0" />

            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-md text-lg">
              {list.emoji ?? '👥'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{list.name}</p>
              <p className="text-muted-foreground text-xs">
                {list.memberCount} {list.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditListId(list.id);
                  setEditName(list.name);
                  setEditEmoji(list.emoji ?? '');
                }}
              >
                <Edit2 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(list.id);
                }}
              >
                <Trash2 className="text-destructive size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {(!lists || lists.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <List className="text-muted-foreground/40 size-10" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">No lists yet</h3>
            <p className="text-muted-foreground text-xs">
              Create lists to organize the people you follow
            </p>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-4" />
            New list
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New list</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) create();
            }}
            className="space-y-3"
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="List name" />
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

      <Dialog
        open={!!editListId}
        onOpenChange={(open) => {
          if (!open) {
            setEditListId(null);
            setEditName('');
            setEditEmoji('');
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editListId && editName.trim()) {
                update({
                  listId: editListId,
                  name: editName.trim(),
                  emoji: editEmoji || undefined,
                });
              }
            }}
            className="space-y-3"
          >
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="List name"
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
