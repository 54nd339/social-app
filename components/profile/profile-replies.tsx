'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, truncate } from '@/lib/utils';

interface ProfileReply {
  id: string;
  postId: string;
  postContent: string;
  postContentWarning: string | null;
  commentContent: string;
  createdAt: string;
}

interface ProfileRepliesResponse {
  replies: ProfileReply[];
  nextCursor: string | null;
}

async function fetchUserReplies({
  pageParam,
  username,
}: {
  pageParam: string | undefined;
  username: string;
}): Promise<ProfileRepliesResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/users/${username}/replies?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch replies');
  return res.json();
}

function ReplySkeleton() {
  return (
    <div className="border-b p-4">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

interface ProfileRepliesProps {
  username: string;
}

const POST_SNIPPET_LENGTH = 80;

export function ProfileReplies({ username }: ProfileRepliesProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['user-replies', username],
    queryFn: ({ pageParam }) => fetchUserReplies({ pageParam, username }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <ReplySkeleton key={i} />
        ))}
      </div>
    );
  }

  const allReplies = data?.pages.flatMap((page) => page.replies) ?? [];

  if (allReplies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <MessageSquare className="text-muted-foreground/50 size-8" />
        <p className="text-muted-foreground text-sm">No replies yet</p>
      </div>
    );
  }

  return (
    <div>
      {allReplies.map((reply) => (
        <Link
          key={reply.id}
          href={`/post/${reply.postId}`}
          className="hover:bg-accent/50 block border-b p-4 transition-colors"
        >
          <p className="text-muted-foreground line-clamp-1 text-xs">
            Replying to: {truncate(reply.postContent, POST_SNIPPET_LENGTH)}
          </p>
          {reply.postContentWarning && (
            <p className="mt-1 mb-1 text-xs text-amber-600">CW: {reply.postContentWarning}</p>
          )}
          <p className="mt-1 line-clamp-2 text-sm whitespace-pre-wrap">{reply.commentContent}</p>
          <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
            <time>{formatRelativeTime(reply.createdAt)}</time>
          </div>
        </Link>
      ))}

      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
