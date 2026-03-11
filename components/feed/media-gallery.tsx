'use client';

import { useState } from 'react';

import { OptimizedImage } from '@/components/shared/optimized-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  url: string;
  type: string;
  blurhash: string | null;
  width: number | null;
  height: number | null;
  order: number;
}

interface MediaGalleryProps {
  media: MediaItem[];
}

const GRID_LAYOUTS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2',
  4: 'grid-cols-2',
};

export function MediaGallery({ media }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (media.length === 0) return null;

  const gridClass = GRID_LAYOUTS[Math.min(media.length, 4)] ?? 'grid-cols-2';

  return (
    <>
      <div className={cn('grid gap-1 overflow-hidden rounded-xl', gridClass)}>
        {media.slice(0, 4).map((item, idx) => {
          const isLast = idx === 3 && media.length > 4;
          const isThreeOdd = media.length === 3 && idx === 0;

          return (
            <button
              key={item.id}
              className={cn(
                'bg-muted relative overflow-hidden',
                isThreeOdd ? 'row-span-2 aspect-[3/4]' : 'aspect-square',
              )}
              onClick={() => setLightboxIndex(idx)}
            >
              <OptimizedImage
                src={item.url}
                alt=""
                fill
                blurhash={item.blurhash}
                className="object-cover transition-transform hover:scale-105"
                sizes={media.length === 1 ? '600px' : '300px'}
              />
              {isLast && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-2xl font-bold text-white">+{media.length - 4}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {lightboxIndex !== null && media[lightboxIndex] && (
            <div className="relative aspect-auto max-h-[85vh]">
              <OptimizedImage
                src={media[lightboxIndex].url}
                alt=""
                blurhash={media[lightboxIndex].blurhash}
                width={media[lightboxIndex].width ?? 1200}
                height={media[lightboxIndex].height ?? 800}
                className="h-auto max-h-[85vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
