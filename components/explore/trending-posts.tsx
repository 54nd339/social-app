'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { HavenLogo } from '@/components/shared/haven-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { SearchPost } from '@/lib/db/queries/search.queries';
import { formatRelativeTime, truncate } from '@/lib/utils';

async function fetchTrending(): Promise<SearchPost[]> {
  const res = await fetch('/api/search/trending');
  if (!res.ok) throw new Error('Failed to fetch trending');
  return res.json();
}

function TrendingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function TrendingPosts() {
  const { data: trending, isLoading } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: fetchTrending,
  });

  if (isLoading) return <TrendingSkeleton />;
  if (!trending || trending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <HavenLogo className="text-muted-foreground/40 size-6" />
        <p className="text-muted-foreground text-xs">Nothing trending yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-1 pb-3">
        <HavenLogo className="text-primary size-4" />
        <h3 className="text-sm font-semibold">Trending this week</h3>
      </div>

      <div className="space-y-1">
        {trending.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="hover:bg-accent/50 block rounded-lg p-2 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={post.author.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {post.author.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">
                {post.author.displayName ?? post.author.username}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm">{truncate(post.content, 120)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
