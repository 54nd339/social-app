'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
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
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            className={cn(
              'hover:bg-accent/50 flex items-center gap-3 border-b px-4 py-3 transition-colors',
              conv.unreadCount > 0 && 'bg-primary/5',
            )}
          >
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
                  {displayName}
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
          </Link>
        );
      })}
    </div>
  );
}
