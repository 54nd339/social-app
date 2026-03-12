'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Flame, Handshake, Heart, Laugh, Lightbulb, Palette, ThumbsUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ZenMetric } from '@/components/shared/zen-metric';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toggleReaction } from '@/lib/actions/post.actions';
import { REACTION_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const REACTION_ICONS: Record<string, LucideIcon> = {
  insightful: Lightbulb,
  creative: Palette,
  supportive: Handshake,
  funny: Laugh,
  heartwarming: Heart,
  fire: Flame,
};

interface ReactionBarProps {
  entityId: string;
  entityType: 'post' | 'comment';
  reactionCounts: Record<string, number>;
  userReaction: string | null;
}

export function ReactionBar({
  entityId,
  entityType,
  reactionCounts,
  userReaction,
}: ReactionBarProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [optimisticReaction, setOptimisticReaction] = useState(userReaction);
  const [optimisticCounts, setOptimisticCounts] = useState(reactionCounts);

  const { mutate: react } = useMutation({
    mutationFn: (reactionType: string) => toggleReaction(entityId, entityType, reactionType),
    onMutate: (reactionType) => {
      const prevReaction = optimisticReaction;
      const prevCounts = { ...optimisticCounts };

      const newCounts = { ...optimisticCounts };

      if (prevReaction === reactionType) {
        newCounts[reactionType] = Math.max(0, (newCounts[reactionType] ?? 0) - 1);
        if (newCounts[reactionType] === 0) delete newCounts[reactionType];
        setOptimisticReaction(null);
      } else {
        if (prevReaction) {
          newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] ?? 0) - 1);
          if (newCounts[prevReaction] === 0) delete newCounts[prevReaction];
        }
        newCounts[reactionType] = (newCounts[reactionType] ?? 0) + 1;
        setOptimisticReaction(reactionType);
      }

      setOptimisticCounts(newCounts);
      return { prevReaction, prevCounts };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        setOptimisticReaction(context.prevReaction);
        setOptimisticCounts(context.prevCounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  function handleReact(reactionType: string) {
    setOpen(false);
    react(reactionType);
  }

  const totalReactions = Object.values(optimisticCounts).reduce((sum, count) => sum + count, 0);
  const topReactions = Object.entries(optimisticCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-1.5 text-xs', optimisticReaction && 'text-primary')}
          >
            {(() => {
              const Icon = optimisticReaction
                ? (REACTION_ICONS[optimisticReaction] ?? ThumbsUp)
                : ThumbsUp;
              return <Icon className="size-4" />;
            })()}
            <ZenMetric value={totalReactions} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align="start" side="top">
          <div className="flex gap-0.5">
            {REACTION_TYPES.map((type) => {
              const Icon = REACTION_ICONS[type] ?? ThumbsUp;
              return (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        'transition-transform hover:scale-125',
                        optimisticReaction === type && 'bg-primary/10 text-primary',
                      )}
                      onClick={() => handleReact(type)}
                    >
                      <Icon className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs capitalize">
                    {type}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {topReactions.length > 0 && (
        <div className="flex -space-x-1">
          {topReactions.map(([type]) => {
            const Icon = REACTION_ICONS[type] ?? ThumbsUp;
            return <Icon key={type} className="text-muted-foreground size-3.5" />;
          })}
        </div>
      )}
    </div>
  );
}
