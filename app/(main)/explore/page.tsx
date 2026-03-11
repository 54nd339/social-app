import { Suspense } from 'react';
import type { Metadata } from 'next';

import { SearchBar, SearchResults, SuggestedUsers, TrendingPosts } from '@/components/explore';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover trending posts, find new people, and explore topics on Haven.',
};

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="mb-3 text-lg font-semibold">Explore</h1>
        <Suspense fallback={<Skeleton className="h-9 w-full" />}>
          <SearchBar />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>

      <div className="space-y-6 p-4">
        <SuggestedUsers />
        <Separator />
        <TrendingPosts />
      </div>
    </div>
  );
}
