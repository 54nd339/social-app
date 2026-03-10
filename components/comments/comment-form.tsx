'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createComment } from '@/lib/actions/comment.actions';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  autoFocus = false,
  placeholder = 'Write a comment...',
  compact = false,
}: CommentFormProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      createComment({
        postId,
        content,
        parentId: parentId ?? null,
      }),
    onSuccess: () => {
      setContent('');
      setIsFocused(false);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      onSuccess?.();
    },
  });

  const canSubmit = content.trim().length > 0 && content.length <= MAX_COMMENT_LENGTH && !isPending;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={cn('flex gap-2', compact ? 'p-2' : 'p-4')}>
      <Avatar className={cn(compact ? 'size-7' : 'size-8', 'shrink-0')}>
        <AvatarImage src={user?.imageUrl} alt={user?.username ?? ''} />
        <AvatarFallback className="text-xs">
          {user?.username?.charAt(0).toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'resize-none text-sm transition-all',
            compact ? 'min-h-[36px]' : 'min-h-[44px]',
            !isFocused && 'max-h-[44px]',
          )}
          rows={isFocused ? 3 : 1}
        />

        {(isFocused || content.length > 0) && (
          <div className="mt-2 flex items-center justify-between">
            <span
              className={cn(
                'text-xs tabular-nums',
                content.length > MAX_COMMENT_LENGTH ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {content.length > 0 && `${content.length}/${MAX_COMMENT_LENGTH}`}
            </span>
            <div className="flex items-center gap-2">
              {content.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setContent('');
                    setIsFocused(false);
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button size="xs" disabled={!canSubmit} onClick={() => submit()}>
                {isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <>
                    <Send className="size-3" />
                    Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
