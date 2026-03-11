'use client';

import { useState } from 'react';
import { Loader2, UserPlus, X } from 'lucide-react';

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

interface CollabUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CollabInviteProps {
  selectedUser: CollabUser | null;
  onSelect: (user: CollabUser | null) => void;
}

async function searchUsers(query: string): Promise<CollabUser[]> {
  if (!query.trim()) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=users&limit=8`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.users ?? [];
}

export function CollabInvite({ selectedUser, onSelect }: CollabInviteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CollabUser[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await searchUsers(q);
      setResults(users);
    } finally {
      setSearching(false);
    }
  }

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-2 py-1">
        <UserPlus className="text-primary size-3.5" />
        <Avatar className="size-5">
          <AvatarImage src={selectedUser.avatarUrl ?? undefined} />
          <AvatarFallback className="text-[8px]">
            {selectedUser.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">
          {selectedUser.displayName ?? selectedUser.username}
        </span>
        <Button variant="ghost" size="icon-xs" onClick={() => onSelect(null)}>
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <UserPlus className="size-3.5" />
          Co-author
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add co-author</DialogTitle>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
          autoFocus
        />
        <div className="max-h-52 space-y-1 overflow-y-auto">
          {searching && (
            <div className="flex justify-center py-4">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                onSelect(u);
                setOpen(false);
                setQuery('');
                setResults([]);
              }}
              className="hover:bg-accent flex w-full items-center gap-3 rounded-md px-2 py-2"
            >
              <Avatar className="size-8">
                <AvatarImage src={u.avatarUrl ?? undefined} />
                <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium">{u.displayName ?? u.username}</p>
                <p className="text-muted-foreground truncate text-xs">@{u.username}</p>
              </div>
            </button>
          ))}
          {query && !searching && results.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">No users found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
