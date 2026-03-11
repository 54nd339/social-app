'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { StoryRing } from '@/lib/db/queries/story.queries';

import { StoryRings } from './story-ring';
import { StoryViewer } from './story-viewer';

async function fetchRings(): Promise<StoryRing[]> {
  const res = await fetch('/api/stories');
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export function StoriesBar() {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const { data: rings } = useQuery({
    queryKey: ['story-rings'],
    queryFn: fetchRings,
  });

  function handleView(userId: string) {
    setViewUserId(userId);
    setViewerOpen(true);
  }

  return (
    <>
      <StoryRings
        onView={handleView}
        onCreateStory={() => {
          // TODO: open story creation modal
        }}
      />
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
