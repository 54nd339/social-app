'use client';

import { useQuery } from '@tanstack/react-query';

import type { OgData } from '@/lib/og-scraper';

const URL_REGEX = /https?:\/\/[^\s<]+/g;

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match?.[0] ?? null;
}

async function fetchOgData(url: string): Promise<OgData | null> {
  const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
  if (!res.ok) return null;
  return res.json();
}

export function useLinkPreview(text: string) {
  const url = extractFirstUrl(text);

  return useQuery({
    queryKey: ['og-preview', url],
    queryFn: () => fetchOgData(url!),
    enabled: !!url,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}
