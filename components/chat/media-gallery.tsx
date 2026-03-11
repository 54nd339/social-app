'use client';

import Image from 'next/image';
import { File, ImageIcon, Music } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MediaItem } from '@/lib/db/queries/media-gallery.queries';

interface MediaGalleryProps {
  conversationId: string;
}

async function fetchMedia(
  conversationId: string,
  cursor?: string,
): Promise<{ items: MediaItem[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/conversations/${conversationId}/media?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

function MediaGrid({ items }: { items: MediaItem[] }) {
  const images = items.filter((i) => i.type === 'image' || i.type === 'gif');
  const files = items.filter((i) => i.type === 'doc' || i.type === 'voice');

  return (
    <Tabs defaultValue="photos" className="w-full">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="photos"
          className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:shadow-none"
        >
          <ImageIcon className="mr-1.5 size-3.5" />
          Photos ({images.length})
        </TabsTrigger>
        <TabsTrigger
          value="files"
          className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:shadow-none"
        >
          <File className="mr-1.5 size-3.5" />
          Files ({files.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="photos" className="mt-0 p-2">
        {images.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">No photos shared</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {images.map((item) => (
              <a
                key={item.id}
                href={item.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-sm"
              >
                <Image
                  src={item.mediaUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 128px"
                />
              </a>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="files" className="mt-0 p-2">
        {files.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">No files shared</p>
        ) : (
          <div className="space-y-1">
            {files.map((item) => (
              <a
                key={item.id}
                href={item.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-accent flex items-center gap-3 rounded-md p-2 transition-colors"
              >
                {item.type === 'voice' ? (
                  <Music className="text-primary size-5" />
                ) : (
                  <File className="text-primary size-5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.fileName ?? 'Untitled'}</p>
                  <p className="text-muted-foreground text-xs">
                    From {item.senderDisplayName ?? item.senderUsername}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function MediaGallery({ conversationId }: MediaGalleryProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['conversation-media', conversationId],
    queryFn: ({ pageParam }) => fetchMedia(conversationId, pageParam),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 p-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <MediaGrid items={allItems} />
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-primary w-full py-3 text-center text-sm"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
