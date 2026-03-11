'use client';

import { useEffect, useRef } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import type { FeedPost } from '@/lib/db/queries/post.queries';

import { PostCard } from './post-card';

interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

async function fetchFeed({ pageParam }: { pageParam: string | undefined }): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/feed?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch feed');
  return res.json();
}

function PostSkeleton() {
  return (
    <div className="border-b p-4">
      <div className="flex gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedList() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: fetchFeed,
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
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-muted-foreground text-sm">Something went wrong loading your feed.</p>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="bg-primary/10 flex size-16 items-center justify-center rounded-2xl">
          <Flame className="text-primary size-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Your feed is empty</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            Create your first post or follow some people to see their posts here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
      </div>

      {!hasNextPage && allPosts.length > 0 && (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <Flame className="text-primary size-5" />
          <p className="text-muted-foreground text-xs">You&apos;re all caught up</p>
        </div>
      )}
    </div>
  );
}
