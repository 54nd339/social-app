'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatRelativeTime } from '@/lib/utils';

interface EditIndicatorProps {
  postId: string;
  editedAt: Date;
}

export function EditIndicator({ postId, editedAt }: EditIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/post/${postId}/history`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-xs transition-colors"
        >
          <Pencil className="size-2.5" />
          <span>edited</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>Edited {formatRelativeTime(editedAt)} · Click to view history</TooltipContent>
    </Tooltip>
  );
}
