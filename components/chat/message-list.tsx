'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChatMessage } from '@/lib/db/queries/chat.queries';
import { cn, formatRelativeTime } from '@/lib/utils';

interface MessagesResponse {
  messages: ChatMessage[];
  nextCursor: string | null;
}

async function fetchMessages({
  pageParam,
  conversationId,
}: {
  pageParam: string | undefined;
  conversationId: string;
}): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
}

function MessageSkeleton() {
  return (
    <div className="flex gap-2 px-4 py-1">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
    </div>
  );
}

export function MessageList({ conversationId, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => fetchMessages({ pageParam, conversationId }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allMessages = useMemo(() => data?.pages.flatMap((page) => page.messages) ?? [], [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '100px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div ref={loadMoreRef} className="py-2">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="space-y-1 px-4 py-2">
        {allMessages.map((msg, idx) => {
          const isOwn = msg.sender.id === currentUserId;
          const prevMsg = allMessages[idx - 1];
          const sameSender = prevMsg?.sender.id === msg.sender.id;
          const showAvatar = !isOwn && !sameSender;

          if (msg.isDeletedForEveryone) {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span className="text-muted-foreground text-xs italic">Message deleted</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}>
              {!isOwn && (
                <div className="w-7 shrink-0">
                  {showAvatar && (
                    <Avatar className="size-7">
                      <AvatarImage src={msg.sender.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {msg.sender.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}

              <div className={cn('max-w-[70%] space-y-0.5', isOwn && 'items-end')}>
                {showAvatar && (
                  <p className="text-muted-foreground px-1 text-[11px] font-medium">
                    {msg.sender.displayName ?? msg.sender.username}
                  </p>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 text-sm',
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm',
                  )}
                >
                  {msg.type === 'text' && msg.content && (
                    <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.type === 'image' && msg.mediaUrl && (
                    <Image
                      src={msg.mediaUrl}
                      alt=""
                      width={400}
                      height={300}
                      className="max-w-full rounded-lg"
                      unoptimized
                    />
                  )}
                  {msg.type === 'gif' && msg.mediaUrl && (
                    <Image
                      src={msg.mediaUrl}
                      alt="GIF"
                      width={250}
                      height={200}
                      className="max-w-full rounded-lg"
                      unoptimized
                    />
                  )}
                  {msg.type === 'voice' && msg.mediaUrl && (
                    <audio controls src={msg.mediaUrl} className="max-w-full" />
                  )}
                  {msg.type === 'doc' && (
                    <p className="text-xs underline">{msg.fileName ?? 'Document'}</p>
                  )}
                  {msg.isViewOnce && <p className="text-[10px] opacity-60">View once</p>}
                </div>

                <p className={cn('text-muted-foreground px-1 text-[10px]', isOwn && 'text-right')}>
                  {formatRelativeTime(msg.createdAt)}
                  {msg.isEdited && ' · edited'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
