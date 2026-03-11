'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';

import { useStoryRings } from '@/hooks/use-stories';

import { CreateStoryDialog } from './create-story-dialog';
import { StoryRings } from './story-ring';

const StoryViewer = dynamic(() => import('./story-viewer').then((m) => m.StoryViewer), {
  ssr: false,
  loading: () => <div className="bg-muted h-40 animate-pulse rounded-lg" />,
});

export function StoriesBar() {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const { data: rings } = useStoryRings();

  function handleView(userId: string) {
    setViewUserId(userId);
    setViewerOpen(true);
  }

  const createStorySlot = (
    <CreateStoryDialog>
      <button type="button" className="flex flex-col items-center gap-1.5">
        <div className="border-muted-foreground/30 relative flex size-16 items-center justify-center rounded-full border-2 border-dashed">
          <Plus className="text-muted-foreground size-6" />
        </div>
        <span className="text-muted-foreground w-16 truncate text-center text-[11px]">
          Add story
        </span>
      </button>
    </CreateStoryDialog>
  );

  return (
    <>
      <StoryRings onView={handleView} createStorySlot={createStorySlot} />
      {rings && viewUserId && (
        <StoryViewer
          rings={rings}
          initialUserId={viewUserId}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}
    </>
  );
}
