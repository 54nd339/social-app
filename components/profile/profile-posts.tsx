'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { FileText, Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/utils';

interface ProfilePost {
  id: string;
  content: string;
  visibility: string;
  contentWarning: string | null;
  isEdited: boolean;
  createdAt: string;
}

interface ProfilePostsResponse {
  posts: ProfilePost[];
  nextCursor: string | null;
}

async function fetchUserPosts({
  pageParam,
  username,
}: {
  pageParam: string | undefined;
  username: string;
}): Promise<ProfilePostsResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/users/${username}/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

function PostSkeleton() {
  return (
    <div className="border-b p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

interface ProfilePostsProps {
  username: string;
}

export function ProfilePosts({ username }: ProfilePostsProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['user-posts', username],
    queryFn: ({ pageParam }) => fetchUserPosts({ pageParam, username }),
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

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <FileText className="text-muted-foreground/50 size-8" />
        <p className="text-muted-foreground text-sm">No posts yet</p>
      </div>
    );
  }

  return (
    <div>
      {allPosts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="hover:bg-accent/50 block border-b p-4 transition-colors"
        >
          {post.contentWarning && (
            <p className="mb-1 text-xs text-amber-600">CW: {post.contentWarning}</p>
          )}
          <p className="line-clamp-3 text-sm whitespace-pre-wrap">{post.content}</p>
          <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
            <time>{formatRelativeTime(post.createdAt)}</time>
            {post.isEdited && <span>· Edited</span>}
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
