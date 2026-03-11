'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createConversation } from '@/lib/actions/chat.actions';

interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface NewConversationDialogProps {
  children: React.ReactNode;
}

export function NewConversationDialog({ children }: NewConversationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [_isPending, startTransition] = useTransition();

  const { mutate: startConversation, isPending } = useMutation({
    mutationFn: (otherUserId: string) => createConversation(otherUserId),
    onSuccess: (data) => {
      setOpen(false);
      router.push(`/messages/${data.conversationId}`);
    },
  });

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}&type=users`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users ?? []);
      }
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => {
              startTransition(() => handleSearch(e.target.value));
            }}
            placeholder="Search people..."
            className="pl-9"
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isSearching && (
            <div className="flex justify-center py-6">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          )}

          {!isSearching && results.length === 0 && query.length >= 2 && (
            <p className="text-muted-foreground py-6 text-center text-sm">No users found</p>
          )}

          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => startConversation(user.id)}
              disabled={isPending}
              className="hover:bg-accent/50 flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors disabled:opacity-50"
            >
              <Avatar className="size-10">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium">{user.displayName ?? user.username}</p>
                <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
