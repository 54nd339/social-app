'use client';

import { useQuery } from '@tanstack/react-query';

import type { StoryRing } from '@/lib/db/queries/story.queries';

async function fetchStoryRings(): Promise<StoryRing[]> {
  const res = await fetch('/api/stories');
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export function useStoryRings() {
  return useQuery({
    queryKey: ['story-rings'],
    queryFn: fetchStoryRings,
  });
}
