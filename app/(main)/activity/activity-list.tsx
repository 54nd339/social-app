'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bookmark, Heart, MessageCircle, Share2, UserPlus } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityItem } from '@/lib/db/queries/activity.queries';
import { formatRelativeTime } from '@/lib/utils';

interface ActivityResponse {
  items: ActivityItem[];
  nextCursor: string | null;
}

const ACTION_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  reaction: { icon: Heart, label: 'Reacted to a post', color: 'text-pink-500' },
  comment: { icon: MessageCircle, label: 'Commented on a post', color: 'text-blue-500' },
  follow: { icon: UserPlus, label: 'Followed someone', color: 'text-green-500' },
  share: { icon: Share2, label: 'Shared a post', color: 'text-purple-500' },
  bookmark: { icon: Bookmark, label: 'Saved a post', color: 'text-amber-500' },
};

async function fetchActivity({
  pageParam,
}: {
  pageParam: string | undefined;
}): Promise<ActivityResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/activity?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch activity');
  return res.json();
}

export function ActivityList() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['activity'],
    queryFn: fetchActivity,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

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
      <div className="space-y-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Heart className="text-muted-foreground/40 size-10" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">No activity yet</h3>
          <p className="text-muted-foreground text-xs">
            Your reactions, comments, and follows will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {allItems.map((item) => {
        const config = ACTION_CONFIG[item.action] ?? ACTION_CONFIG.reaction!;
        const Icon = config.icon;
        const href = item.entityType === 'post' ? `/post/${item.entityId}` : `#`;

        return (
          <Link
            key={item.id}
            href={href}
            className="hover:bg-accent/50 flex items-center gap-3 border-b px-4 py-3 transition-colors"
          >
            <div
              className={`bg-muted flex size-8 shrink-0 items-center justify-center rounded-full ${config.color}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{config.label}</p>
              <p className="text-muted-foreground text-xs">{formatRelativeTime(item.createdAt)}</p>
            </div>
          </Link>
        );
      })}
      <div ref={loadMoreRef} />
    </div>
  );
}
