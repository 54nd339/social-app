'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FileText, SearchX, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SearchPost, SearchUser } from '@/lib/db/queries/search.queries';
import { formatRelativeTime, truncate } from '@/lib/utils';

interface SearchResponse {
  users: SearchUser[];
  posts: SearchPost[];
}

async function fetchSearch(q: string): Promise<SearchResponse> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

function UserResult({ user }: { user: SearchUser }) {
  return (
    <Link
      href={`/${user.username}`}
      className="hover:bg-accent flex items-center gap-3 rounded-lg p-3 transition-colors"
    >
      <Avatar className="size-10">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {user.displayName ?? user.username}
          </span>
          {user.isFollowing && (
            <Badge variant="secondary" className="text-[10px]">
              Following
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
        {user.bio && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}

function PostResult({ post }: { post: SearchPost }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="hover:bg-accent block rounded-lg p-3 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Avatar className="size-6">
          <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.username} />
          <AvatarFallback className="text-[10px]">
            {post.author.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">
          {post.author.displayName ?? post.author.username}
        </span>
        <span className="text-muted-foreground text-xs">{formatRelativeTime(post.createdAt)}</span>
      </div>
      {post.contentWarning && (
        <p className="mt-1 text-xs text-amber-600">CW: {post.contentWarning}</p>
      )}
      <p className="mt-1 text-sm">{truncate(post.content, 200)}</p>
    </Link>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => fetchSearch(q),
    enabled: q.length >= 2,
  });

  if (!q || q.length < 2) return null;

  if (isLoading) return <ResultsSkeleton />;

  const hasUsers = (data?.users.length ?? 0) > 0;
  const hasPosts = (data?.posts.length ?? 0) > 0;
  const hasAny = hasUsers || hasPosts;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <SearchX className="text-muted-foreground/40 size-10" />
        <p className="text-sm font-medium">No results for &ldquo;{q}&rdquo;</p>
        <p className="text-muted-foreground text-xs">Try a different search term</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="all">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="all"
          className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:shadow-none"
        >
          All
        </TabsTrigger>
        {hasUsers && (
          <TabsTrigger
            value="people"
            className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:shadow-none"
          >
            <Users className="mr-1 size-3.5" />
            People ({data!.users.length})
          </TabsTrigger>
        )}
        {hasPosts && (
          <TabsTrigger
            value="posts"
            className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:shadow-none"
          >
            <FileText className="mr-1 size-3.5" />
            Posts ({data!.posts.length})
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="all" className="mt-0">
        {hasUsers && (
          <>
            <h3 className="text-muted-foreground px-3 pt-3 text-xs font-semibold uppercase">
              People
            </h3>
            {data!.users.slice(0, 5).map((user) => (
              <UserResult key={user.id} user={user} />
            ))}
          </>
        )}
        {hasUsers && hasPosts && <Separator />}
        {hasPosts && (
          <>
            <h3 className="text-muted-foreground px-3 pt-3 text-xs font-semibold uppercase">
              Posts
            </h3>
            {data!.posts.slice(0, 10).map((post) => (
              <PostResult key={post.id} post={post} />
            ))}
          </>
        )}
      </TabsContent>

      <TabsContent value="people" className="mt-0">
        {data!.users.map((user) => (
          <UserResult key={user.id} user={user} />
        ))}
      </TabsContent>

      <TabsContent value="posts" className="mt-0">
        {data!.posts.map((post) => (
          <PostResult key={post.id} post={post} />
        ))}
      </TabsContent>
    </Tabs>
  );
}
