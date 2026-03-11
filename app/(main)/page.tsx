import type { Metadata } from 'next';

import { FeedList, PostComposer } from '@/components/feed';
import { StoriesBar } from '@/components/stories';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Your Haven feed — see what your people are sharing.',
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <StoriesBar />
      <PostComposer />
      <Separator />
      <FeedList />
    </div>
  );
}
