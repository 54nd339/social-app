'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { FollowButton } from '@/components/profile/follow-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { SearchUser } from '@/lib/db/queries/search.queries';

async function fetchSuggested(): Promise<SearchUser[]> {
  const res = await fetch('/api/search/suggested');
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  return res.json();
}

function SuggestedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SuggestedUsers() {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: fetchSuggested,
  });

  if (isLoading) return <SuggestedSkeleton />;
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 px-1 pb-3">
        <UserPlus className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">Suggested for you</h3>
      </div>

      <div className="space-y-1">
        {suggestions.map((user) => (
          <div
            key={user.id}
            className="hover:bg-accent/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
          >
            <Link href={`/${user.username}`}>
              <Avatar className="size-10">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/${user.username}`} className="block">
                <p className="truncate text-sm font-medium hover:underline">
                  {user.displayName ?? user.username}
                </p>
                <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
              </Link>
              {user.bio && (
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{user.bio}</p>
              )}
            </div>
            <FollowButton userId={user.id} initialStatus="none" />
          </div>
        ))}
      </div>
    </div>
  );
}
