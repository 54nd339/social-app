'use client';

import { useQuery } from '@tanstack/react-query';

import type { CircleWithCount } from '@/lib/db/queries/circle.queries';

async function fetchCircles(): Promise<CircleWithCount[]> {
  const res = await fetch('/api/circles');
  if (!res.ok) return [];
  return res.json();
}

export function useCircles(enabled = true) {
  return useQuery({
    queryKey: ['circles'],
    queryFn: fetchCircles,
    enabled,
  });
}
