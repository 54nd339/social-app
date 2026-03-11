'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bookmark, X } from 'lucide-react';
import { toast } from 'sonner';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { removeFromCollection } from '@/lib/actions/collection.actions';
import type { CollectionPost } from '@/lib/db/queries/collection.queries';
import { formatRelativeTime, truncate } from '@/lib/utils';

interface PostsResponse {
  posts: CollectionPost[];
  nextCursor: string | null;
}

async function fetchPosts({
  pageParam,
  collectionId,
}: {
  pageParam: string | undefined;
  collectionId: string;
}): Promise<PostsResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/collections/${collectionId}/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

interface CollectionPostListProps {
  collectionId: string;
}

export function CollectionPostList({ collectionId }: CollectionPostListProps) {
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { mutate: handleRemove } = useMutation({
    mutationFn: (postId: string) => removeFromCollection(collectionId, postId),
    onSuccess: () => {
      toast.success('Removed from collection');
      queryClient.invalidateQueries({ queryKey: ['collection-posts', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: () => toast.error('Failed to remove'),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['collection-posts', collectionId],
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, collectionId }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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

  return (
    <div>
      <div className="bg-background/80 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/collections">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Collection</h1>
      </div>

      {isLoading && (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {allPosts.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Bookmark className="text-muted-foreground/40 size-10" />
          <h3 className="text-sm font-semibold">No posts in this collection</h3>
        </div>
      )}

      <div>
        {allPosts.map((post) => (
          <div
            key={post.id}
            className="hover:bg-accent/50 group relative flex gap-3 border-b px-4 py-3 transition-colors"
          >
            <Link href={`/post/${post.id}`} className="absolute inset-0 z-0" />
            <Avatar className="size-9">
              <AvatarImage src={post.author.avatarUrl ?? undefined} />
              <AvatarFallback>{post.author.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {post.author.displayName ?? post.author.username}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">{truncate(post.content, 120)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              className="relative z-10 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={() => handleRemove(post.id)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div ref={loadMoreRef} />
    </div>
  );
}
