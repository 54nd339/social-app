'use client';

import Image from 'next/image';
import { Plus, Sparkles } from 'lucide-react';

import type { StoryHighlightItem } from '@/lib/db/queries/profile-power.queries';

interface StoryHighlightsProps {
  highlights: StoryHighlightItem[];
  isSelf?: boolean;
}

export function StoryHighlights({ highlights, isSelf }: StoryHighlightsProps) {
  if (highlights.length === 0 && !isSelf) return null;

  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-3">
      {isSelf && (
        <button className="flex flex-col items-center gap-1.5">
          <div className="border-muted-foreground/30 flex size-16 items-center justify-center rounded-full border-2 border-dashed">
            <Plus className="text-muted-foreground size-5" />
          </div>
          <span className="text-muted-foreground max-w-16 truncate text-[10px]">New</span>
        </button>
      )}

      {highlights.map((hl) => (
        <button key={hl.id} className="flex flex-col items-center gap-1.5">
          <div className="from-primary/40 to-primary/80 flex size-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br p-0.5">
            <div className="bg-background flex size-full items-center justify-center overflow-hidden rounded-full">
              {hl.coverUrl ? (
                <Image
                  src={hl.coverUrl}
                  alt={hl.name}
                  width={56}
                  height={56}
                  className="size-full object-cover"
                />
              ) : (
                <Sparkles className="text-primary size-5" />
              )}
            </div>
          </div>
          <span className="max-w-16 truncate text-[10px] font-medium">{hl.name}</span>
        </button>
      ))}
    </div>
  );
}
