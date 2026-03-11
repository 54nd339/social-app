'use client';

import Link from 'next/link';
import { Archive, BellOff, MessageSquare, MoreHorizontal, Pin } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  toggleArchiveConversation,
  toggleMuteConversation,
  togglePinConversation,
} from '@/lib/actions/chat-extra.actions';
import type { ConversationPreview } from '@/lib/db/queries/chat.queries';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';

async function fetchConversations(): Promise<ConversationPreview[]> {
  const res = await fetch('/api/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

export function ConversationList() {
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });

  const { mutate: toggleMute } = useMutation({
    mutationFn: (id: string) => toggleMuteConversation(id),
    onSuccess: (result) => {
      toast.success(result.muted ? 'Muted' : 'Unmuted');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const { mutate: toggleArchive } = useMutation({
    mutationFn: (id: string) => toggleArchiveConversation(id),
    onSuccess: (result) => {
      toast.success(result.archived ? 'Archived' : 'Unarchived');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const { mutate: togglePin } = useMutation({
    mutationFn: (id: string) => togglePinConversation(id),
    onSuccess: (result) => {
      toast.success(result.pinned ? 'Pinned' : 'Unpinned');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <MessageSquare className="text-muted-foreground/40 size-10" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">No conversations yet</h3>
          <p className="text-muted-foreground text-xs">
            Start a conversation from someone&apos;s profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {conversations.map((conv) => {
        const displayName =
          conv.type === 'direct' && conv.otherUser
            ? (conv.otherUser.displayName ?? conv.otherUser.username)
            : (conv.name ?? 'Group');
        const avatar =
          conv.type === 'direct' && conv.otherUser ? conv.otherUser.avatarUrl : conv.avatarUrl;

        return (
          <div
            key={conv.id}
            className={cn(
              'hover:bg-accent/50 group relative flex items-center gap-3 border-b px-4 py-3 transition-colors',
              conv.unreadCount > 0 && 'bg-primary/5',
            )}
          >
            <Link href={`/messages/${conv.id}`} className="absolute inset-0 z-0" />

            <Avatar className="size-12">
              <AvatarImage src={avatar ?? undefined} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'truncate text-sm',
                    conv.unreadCount > 0 ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {conv.isPinned && <Pin className="mr-1 inline size-3" />}
                  {displayName}
                  {conv.isMuted && <BellOff className="text-muted-foreground ml-1 inline size-3" />}
                </span>
                {conv.lastMessage && (
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {formatRelativeTime(conv.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground truncate text-xs">
                  {conv.lastMessage
                    ? conv.lastMessage.type === 'text'
                      ? truncate(conv.lastMessage.content ?? '', 60)
                      : `[${conv.lastMessage.type}]`
                    : 'No messages yet'}
                </p>
                {conv.unreadCount > 0 && (
                  <Badge className="ml-2 size-5 shrink-0 justify-center rounded-full p-0 text-[10px]">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="relative z-10 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => togglePin(conv.id)}>
                  <Pin className="size-4" />
                  {conv.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleMute(conv.id)}>
                  <BellOff className="size-4" />
                  {conv.isMuted ? 'Unmute' : 'Mute'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleArchive(conv.id)}>
                  <Archive className="size-4" />
                  {conv.isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
