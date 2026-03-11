'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationItem as NotifItem } from '@/lib/db/queries/notification.queries';
import { usePusherChannel } from '@/hooks/use-pusher-channel';

import { NotificationItem } from './notification-item';

interface NotifResponse {
  notifications: NotifItem[];
  nextCursor: string | null;
  unreadCount: number;
}

async function fetchNotifications({
  pageParam,
}: {
  pageParam: string | undefined;
}): Promise<NotifResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/notifications?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

function NotifSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

interface NotificationListProps {
  userId?: string;
}

export function NotificationList({ userId }: NotificationListProps) {
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleNewNotification = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  usePusherChannel(
    userId ? `private-user-${userId}` : null,
    'new-notification',
    handleNewNotification,
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
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
        {Array.from({ length: 8 }).map((_, i) => (
          <NotifSkeleton key={i} />
        ))}
      </div>
    );
  }

  const allNotifs = data?.pages.flatMap((page) => page.notifications) ?? [];

  if (allNotifs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Bell className="text-muted-foreground/40 size-10" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">No notifications yet</h3>
          <p className="text-muted-foreground text-xs">
            When someone interacts with you, you&apos;ll see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {allNotifs.map((notif) => (
        <NotificationItem key={notif.id} notification={notif} />
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
