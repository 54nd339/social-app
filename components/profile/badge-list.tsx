'use client';

import { Award } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { BadgeItem } from '@/lib/db/queries/profile-power.queries';

const BADGE_CONFIG: Record<string, { emoji: string; label: string; description: string }> = {
  first_post: { emoji: '✍️', label: 'First Post', description: 'Published their first post' },
  century_days: { emoji: '💯', label: '100 Days', description: 'Active for 100 days on Haven' },
  community_helper: { emoji: '🤝', label: 'Community Helper', description: 'Helped many members' },
  conversation_starter: {
    emoji: '💬',
    label: 'Conversation Starter',
    description: 'Started meaningful discussions',
  },
  circle_builder: { emoji: '🔵', label: 'Circle Builder', description: 'Built thriving circles' },
  storyteller: { emoji: '📖', label: 'Storyteller', description: 'Shared compelling stories' },
};

interface BadgeListProps {
  badges: BadgeItem[];
}

export function BadgeList({ badges }: BadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      <Award className="text-muted-foreground size-3.5" />
      {badges.map((badge) => {
        const config = BADGE_CONFIG[badge.badgeType];
        if (!config) return null;
        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <span className="cursor-default text-base" role="img" aria-label={config.label}>
                {config.emoji}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{config.label}</p>
              <p className="text-muted-foreground text-xs">{config.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
