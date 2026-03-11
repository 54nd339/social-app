'use client';

import { useQuery } from '@tanstack/react-query';

interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

async function searchUsers(q: string): Promise<SearchUser[]> {
  if (!q || q.length < 2) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=users`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.users ?? [];
}

export function useUserSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: () => searchUsers(query),
    enabled: enabled && query.length >= 2,
    placeholderData: (prev) => prev,
  });
}
