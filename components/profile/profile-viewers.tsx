'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProfileViewer } from '@/lib/db/queries/profile-power.queries';
import { formatRelativeTime } from '@/lib/utils';

async function fetchViewers(): Promise<ProfileViewer[]> {
  const res = await fetch('/api/profile/viewers');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export function ProfileViewers() {
  const { data: viewers, isLoading } = useQuery({
    queryKey: ['profile-viewers'],
    queryFn: fetchViewers,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!viewers || viewers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Eye className="text-muted-foreground/40 size-8" />
        <p className="text-muted-foreground text-sm">No profile views yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {viewers.map((viewer) => (
        <Link
          key={viewer.id}
          href={`/${viewer.username}`}
          className="hover:bg-accent/50 flex items-center gap-3 rounded-md p-2 transition-colors"
        >
          <Avatar className="size-9">
            <AvatarImage src={viewer.avatarUrl ?? undefined} />
            <AvatarFallback>{viewer.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{viewer.displayName ?? viewer.username}</p>
            <p className="text-muted-foreground truncate text-xs">@{viewer.username}</p>
          </div>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(new Date(viewer.viewedAt))}
          </span>
        </Link>
      ))}
    </div>
  );
}
