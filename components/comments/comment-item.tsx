'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit3, MoreHorizontal, Reply, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { ReactionBar } from '@/components/feed/reaction-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { deleteComment, editComment } from '@/lib/actions/comment.actions';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';
import type { CommentWithAuthor } from '@/lib/db/queries/comment.queries';
import { cn, formatRelativeTime } from '@/lib/utils';

import { CommentForm } from './comment-form';

interface CommentItemProps {
  comment: CommentWithAuthor;
  postId: string;
}

const MAX_VISIBLE_DEPTH = 4;

export function CommentItem({ comment, postId }: CommentItemProps) {
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(comment.depth < 2);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = clerkUser?.id === comment.author.id;

  const { mutate: handleEdit, isPending: isEditPending } = useMutation({
    mutationFn: () => editComment({ commentId: comment.id, content: editContent }),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success('Comment updated');
    },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success('Comment deleted');
    },
  });

  const isCapped = comment.depth >= MAX_VISIBLE_DEPTH;

  return (
    <div className={cn('group', comment.depth > 0 && 'ml-4 border-l pl-4 sm:ml-6 sm:pl-4')}>
      <div className="flex gap-2 py-2">
        <Link href={`/${comment.author.username}`} className="shrink-0">
          <Avatar className="size-7">
            <AvatarImage
              src={comment.author.avatarUrl ?? undefined}
              alt={comment.author.username}
            />
            <AvatarFallback className="text-xs">
              {comment.author.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/${comment.author.username}`}
              className="truncate text-xs font-semibold hover:underline"
            >
              {comment.author.displayName ?? comment.author.username}
            </Link>
            <span className="text-muted-foreground truncate text-xs">
              @{comment.author.username}
            </span>
            <span className="text-muted-foreground">·</span>
            <time className="text-muted-foreground shrink-0 text-[11px]">
              {formatRelativeTime(comment.createdAt)}
            </time>
            {comment.isEdited && (
              <span className="text-muted-foreground text-[11px]">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  disabled={
                    !editContent.trim() || editContent.length > MAX_COMMENT_LENGTH || isEditPending
                  }
                  onClick={() => handleEdit()}
                >
                  Save
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          <div className="mt-1 flex items-center gap-0.5">
            <ReactionBar
              entityId={comment.id}
              entityType="comment"
              reactionCounts={comment.reactionCounts}
              userReaction={comment.userReaction}
            />

            {!isCapped && (
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground gap-1 text-xs"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="size-3" />
                Reply
              </Button>
            )}

            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditContent(comment.content);
                      setIsEditing(true);
                    }}
                  >
                    <Edit3 className="size-3" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete()}>
                    <Trash2 className="size-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                compact
                autoFocus
                placeholder={`Reply to @${comment.author.username}...`}
                onSuccess={() => {
                  setShowReplyForm(false);
                  setShowReplies(true);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <>
          {!showReplies ? (
            <button
              className="text-primary ml-9 text-xs font-medium hover:underline"
              onClick={() => setShowReplies(true)}
            >
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <div>
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
