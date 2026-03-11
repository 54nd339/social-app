'use client';

import { Plus } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStoryRings } from '@/hooks/use-stories';

interface StoryRingProps {
  onView: (userId: string) => void;
  onCreateStory?: () => void;
  createStorySlot?: React.ReactNode;
}

export function StoryRings({ onView, onCreateStory, createStorySlot }: StoryRingProps) {
  const { data: rings, isLoading } = useStoryRings();

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden border-b p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="border-b">
      <div className="flex gap-4 p-4">
        {createStorySlot ?? (
          <button onClick={onCreateStory} className="flex flex-col items-center gap-1.5">
            <div className="border-muted-foreground/30 relative flex size-16 items-center justify-center rounded-full border-2 border-dashed">
              <Plus className="text-muted-foreground size-6" />
            </div>
            <span className="text-muted-foreground w-16 truncate text-center text-[11px]">
              Add story
            </span>
          </button>
        )}

        {rings?.map((ring) => (
          <button
            key={ring.userId}
            onClick={() => onView(ring.userId)}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={cn(
                'rounded-full p-0.5',
                ring.hasUnviewed
                  ? 'from-primary via-primary/80 to-primary/60 bg-gradient-to-tr'
                  : 'bg-muted',
              )}
            >
              <Avatar className="border-background size-14 border-2">
                <AvatarImage src={ring.avatarUrl ?? undefined} alt={ring.username} />
                <AvatarFallback>{ring.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <span className="w-16 truncate text-center text-[11px]">
              {ring.displayName ?? ring.username}
            </span>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
