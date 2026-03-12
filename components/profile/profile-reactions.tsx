'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Flame,
  Handshake,
  Heart,
  Laugh,
  Lightbulb,
  Loader2,
  Palette,
  ThumbsUp,
} from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, truncate } from '@/lib/utils';

const REACTION_ICONS: Record<string, LucideIcon> = {
  insightful: Lightbulb,
  creative: Palette,
  supportive: Handshake,
  funny: Laugh,
  heartwarming: Heart,
  fire: Flame,
};

interface ProfileReaction {
  id: string;
  postId: string;
  postContent: string;
  postContentWarning: string | null;
  reactionType: string;
  createdAt: string;
}

interface ProfileReactionsResponse {
  reactions: ProfileReaction[];
  nextCursor: string | null;
}

async function fetchUserReactions({
  pageParam,
  username,
}: {
  pageParam: string | undefined;
  username: string;
}): Promise<ProfileReactionsResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/users/${username}/reactions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch reactions');
  return res.json();
}

function ReactionSkeleton() {
  return (
    <div className="border-b p-4">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

interface ProfileReactionsProps {
  username: string;
}

const POST_SNIPPET_LENGTH = 80;

export function ProfileReactions({ username }: ProfileReactionsProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['user-reactions', username],
    queryFn: ({ pageParam }) => fetchUserReactions({ pageParam, username }),
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
          <ReactionSkeleton key={i} />
        ))}
      </div>
    );
  }

  const allReactions = data?.pages.flatMap((page) => page.reactions) ?? [];

  if (allReactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <Heart className="text-muted-foreground/50 size-8" />
        <p className="text-muted-foreground text-sm">No reactions yet</p>
      </div>
    );
  }

  return (
    <div>
      {allReactions.map((reaction) => (
        <Link
          key={reaction.id}
          href={`/post/${reaction.postId}`}
          className="hover:bg-accent/50 block border-b p-4 transition-colors"
        >
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = REACTION_ICONS[reaction.reactionType] ?? ThumbsUp;
              return <Icon className="text-primary size-5" />;
            })()}
            <span className="text-muted-foreground text-xs capitalize">
              {reaction.reactionType}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm">
            {truncate(reaction.postContent, POST_SNIPPET_LENGTH)}
          </p>
          {reaction.postContentWarning && (
            <p className="mt-1 mb-1 text-xs text-amber-600">CW: {reaction.postContentWarning}</p>
          )}
          <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
            <time>{formatRelativeTime(reaction.createdAt)}</time>
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
