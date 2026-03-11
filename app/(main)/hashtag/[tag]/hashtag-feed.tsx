'use client';

import { useEffect, useRef } from 'react';
import { Hash, Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { PostCard } from '@/components/feed/post-card';
import type { FeedPost } from '@/lib/db/queries/post.queries';

interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

async function fetchHashtagPosts(tag: string, cursor?: string): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/hashtag/${encodeURIComponent(tag)}/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

interface HashtagFeedProps {
  tag: string;
}

export function HashtagFeed({ tag }: HashtagFeedProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['hashtag-posts', tag],
    queryFn: ({ pageParam }) => fetchHashtagPosts(tag, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];

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
      <div className="flex justify-center py-12">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Hash className="text-muted-foreground/40 size-10" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">No posts yet</h3>
          <p className="text-muted-foreground text-xs">Be the first to post with #{tag}</p>
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
    </div>
  );
}
