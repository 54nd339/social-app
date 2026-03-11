'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { addToList, removeFromList } from '@/lib/actions/list.actions';
import { useUserSearch } from '@/hooks/use-user-search';

interface ListMember {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ListDetailProps {
  listId: string;
}

async function fetchMembers(listId: string): Promise<ListMember[]> {
  const res = await fetch(`/api/lists/${listId}/members`);
  if (!res.ok) return [];
  return res.json();
}

export function ListDetail({ listId }: ListDetailProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: searchResults } = useUserSearch(search);

  const { data: members, isLoading } = useQuery({
    queryKey: ['list-members', listId],
    queryFn: () => fetchMembers(listId),
  });

  const { mutate: add } = useMutation({
    mutationFn: (userId: string) => addToList(listId, userId),
    onSuccess: () => {
      toast.success('Member added');
      queryClient.invalidateQueries({ queryKey: ['list-members', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
      setAddOpen(false);
      setSearch('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (userId: string) => removeFromList(listId, userId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['list-members', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const memberIds = new Set(members?.map((m) => m.id) ?? []);

  return (
    <div>
      <div className="bg-background/80 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/lists">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">List members</h1>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : members && members.length > 0 ? (
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="size-10">
                <AvatarImage src={member.avatarUrl ?? undefined} />
                <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.displayName ?? member.username}
                </p>
                <p className="text-muted-foreground truncate text-xs">@{member.username}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={() => remove(member.id)}
              >
                <UserMinus className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-muted-foreground text-sm">No members yet</p>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
          />
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {searchResults
              ?.filter((u: { id: string }) => !memberIds.has(u.id))
              .map(
                (u: {
                  id: string;
                  username: string;
                  displayName: string | null;
                  avatarUrl: string | null;
                }) => (
                  <button
                    key={u.id}
                    onClick={() => add(u.id)}
                    className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={u.avatarUrl ?? undefined} />
                      <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{u.displayName ?? u.username}</p>
                      <p className="text-muted-foreground text-xs">@{u.username}</p>
                    </div>
                  </button>
                ),
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
