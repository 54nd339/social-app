'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { CircleMemberManager } from '@/components/circles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CirclePost } from '@/lib/db/queries/circle.queries';
import { formatRelativeTime } from '@/lib/utils';

interface CircleDetailViewProps {
  circleId: string;
}

async function fetchCirclePosts(
  circleId: string,
  cursor?: string,
): Promise<{ posts: CirclePost[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/circles/${circleId}/posts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export function CircleDetailView({ circleId }: CircleDetailViewProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['circle-posts', circleId],
    queryFn: ({ pageParam }) => fetchCirclePosts(circleId, pageParam),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="posts"
          className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:shadow-none"
        >
          Posts
        </TabsTrigger>
        <TabsTrigger
          value="members"
          className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:shadow-none"
        >
          Members
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-0 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <MessageSquare className="text-muted-foreground/40 size-8" />
            <p className="text-muted-foreground text-sm">No posts shared to this circle yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allPosts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="hover:bg-accent/50 block rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={post.author.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {post.author.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {post.author.displayName ?? post.author.username}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(new Date(post.createdAt))}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-3 text-sm">{post.content}</p>
              </Link>
            ))}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-primary w-full py-2 text-center text-sm"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="members" className="mt-0 p-4">
        <CircleMemberManager circleId={circleId} />
      </TabsContent>
    </Tabs>
  );
}
