'use client';

import Link from 'next/link';
import { Pin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { PinnedPostItem } from '@/lib/db/queries/profile-power.queries';

interface PinnedPostsProps {
  posts: PinnedPostItem[];
}

export function PinnedPosts({ posts }: PinnedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-2 px-4 py-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.postId}`}
          className="hover:bg-accent/50 flex items-start gap-2 rounded-lg border p-3 transition-colors"
        >
          <Pin className="text-primary mt-0.5 size-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                Pinned
              </Badge>
            </div>
            <p className="line-clamp-2 text-sm">{post.content}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
