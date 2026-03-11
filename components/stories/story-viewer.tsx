'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { MoreHorizontal, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteStory, viewStory } from '@/lib/actions/story.actions';
import type { StoryItem, StoryRing } from '@/lib/db/queries/story.queries';
import { formatRelativeTime } from '@/lib/utils';

async function fetchUserStories(userId: string): Promise<StoryItem[]> {
  const res = await fetch(`/api/stories/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

interface StoryViewerProps {
  rings: StoryRing[];
  initialUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryViewer({ rings, initialUserId, open, onOpenChange }: StoryViewerProps) {
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const [currentUserIdx, setCurrentUserIdx] = useState(() =>
    rings.findIndex((r) => r.userId === initialUserId),
  );
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);

  const currentRing = rings[currentUserIdx];
  const isOwnStory = !!clerkUser && currentRing?.clerkId === clerkUser.id;

  const { data: stories } = useQuery({
    queryKey: ['user-stories', currentRing?.userId],
    queryFn: () => fetchUserStories(currentRing!.userId),
    enabled: !!currentRing && open,
  });

  const { mutate: markViewed } = useMutation({
    mutationFn: (storyId: string) => viewStory(storyId),
  });

  const { mutate: handleDeleteStory } = useMutation({
    mutationFn: (storyId: string) => deleteStory(storyId),
    onSuccess: () => {
      toast.success('Story deleted');
      queryClient.invalidateQueries({ queryKey: ['story-rings'] });
      queryClient.invalidateQueries({ queryKey: ['user-stories', currentRing?.userId] });
      goNext();
    },
    onError: () => toast.error('Failed to delete story'),
  });

  const currentStory = stories?.[currentStoryIdx];

  useEffect(() => {
    if (currentStory && !currentStory.isViewed) {
      markViewed(currentStory.id);
    }
  }, [currentStory, markViewed]);

  const goNext = useCallback(() => {
    if (!stories) return;

    if (currentStoryIdx < stories.length - 1) {
      setCurrentStoryIdx((i) => i + 1);
    } else if (currentUserIdx < rings.length - 1) {
      setCurrentUserIdx((i) => i + 1);
      setCurrentStoryIdx(0);
    } else {
      onOpenChange(false);
    }
  }, [stories, currentStoryIdx, currentUserIdx, rings.length, onOpenChange]);

  const goPrev = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx((i) => i - 1);
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx((i) => i - 1);
      setCurrentStoryIdx(0);
    }
  }, [currentStoryIdx, currentUserIdx]);

  useEffect(() => {
    if (!open || !stories) return;

    const timer = setTimeout(goNext, 5000);
    return () => clearTimeout(timer);
  }, [open, stories, currentStoryIdx, goNext]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onOpenChange(false);
    }

    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, goNext, goPrev, onOpenChange]);

  if (!currentRing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-md flex-col overflow-hidden border-0 bg-black p-0">
        {stories && stories.length > 0 && (
          <div className="absolute top-0 right-0 left-0 z-10 flex gap-0.5 px-2 pt-2">
            {stories.map((_, idx) => (
              <div key={idx} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className={`h-full rounded-full bg-white transition-all ${
                    idx < currentStoryIdx
                      ? 'w-full'
                      : idx === currentStoryIdx
                        ? 'w-full animate-[progress_5s_linear]'
                        : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="absolute top-4 right-0 left-0 z-10 flex items-center gap-2 px-3 pt-2">
          <Avatar className="size-8 border border-white/50">
            <AvatarImage src={currentRing.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {currentRing.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-medium text-white">
              {currentRing.displayName ?? currentRing.username}
            </p>
            {currentStory && (
              <p className="text-[10px] text-white/60">
                {formatRelativeTime(currentStory.createdAt)}
              </p>
            )}
          </div>
          {isOwnStory && currentStory && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/20">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteStory(currentStory.id)}
                >
                  <Trash2 className="size-4" />
                  Delete story
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          {currentStory && (
            <Image src={currentStory.mediaUrl} alt="" fill className="object-contain" priority />
          )}

          {currentStory?.caption && (
            <div className="absolute right-0 bottom-16 left-0 px-4 text-center">
              <p className="rounded-lg bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-sm">
                {currentStory.caption}
              </p>
            </div>
          )}

          <button
            onClick={goPrev}
            className="absolute top-0 left-0 z-10 h-full w-1/3"
            aria-label="Previous"
          />
          <button
            onClick={goNext}
            className="absolute top-0 right-0 z-10 h-full w-2/3"
            aria-label="Next"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
