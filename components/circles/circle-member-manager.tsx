'use client';

import { useState } from 'react';
import { Loader2, Plus, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { addCircleMember, removeCircleMember } from '@/lib/actions/circle.actions';
import type { CircleMember } from '@/lib/db/queries/circle.queries';

interface CircleMemberManagerProps {
  circleId: string;
}

async function fetchMembers(circleId: string): Promise<CircleMember[]> {
  const res = await fetch(`/api/circles/${circleId}/members`);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

interface SearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

async function searchFollowing(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=users&limit=10`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.users ?? [];
}

export function CircleMemberManager({ circleId }: CircleMemberManagerProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['circle-members', circleId],
    queryFn: () => fetchMembers(circleId),
  });

  const { mutate: add, isPending: isAdding } = useMutation({
    mutationFn: (userId: string) => addCircleMember(circleId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-members', circleId] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Member added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (userId: string) => removeCircleMember(circleId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-members', circleId] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Member removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchFollowing(q);
      const memberIds = new Set(members?.map((m) => m.id) ?? []);
      setSearchResults(results.filter((r) => !memberIds.has(r.id)));
    } finally {
      setIsSearching(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Members ({members?.length ?? 0})</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <UserPlus className="size-3.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add member</DialogTitle>
            </DialogHeader>
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              autoFocus
            />
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {isSearching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="text-muted-foreground size-5 animate-spin" />
                </div>
              )}
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center gap-3 rounded-md px-2 py-2">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user.displayName ?? user.username}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isAdding}
                    onClick={() => add(user.id)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              ))}
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">No users found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1">
        {members?.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="size-8">
              <AvatarImage src={member.avatarUrl ?? undefined} />
              <AvatarFallback>{member.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.displayName ?? member.username}
              </p>
              <p className="text-muted-foreground truncate text-xs">@{member.username}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => remove(member.id)}>
              <UserMinus className="text-destructive size-3.5" />
            </Button>
          </div>
        ))}
        {members?.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No members yet. Add people you follow.
          </p>
        )}
      </div>
    </div>
  );
}
