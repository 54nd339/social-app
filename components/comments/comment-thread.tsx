'use client';

import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { CommentWithAuthor } from '@/lib/db/queries/comment.queries';

import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

interface CommentThreadProps {
  postId: string;
  initialComments?: CommentWithAuthor[];
}

async function fetchComments(postId: string): Promise<CommentWithAuthor[]> {
  const res = await fetch(`/api/posts/${postId}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

function CommentSkeleton() {
  return (
    <div className="flex gap-2 py-2">
      <Skeleton className="size-7 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function CommentThread({ postId, initialComments }: CommentThreadProps) {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    initialData: initialComments,
  });

  return (
    <div>
      <CommentForm postId={postId} />
      <Separator />

      <div className="px-4 py-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} postId={postId} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MessageCircle className="text-muted-foreground/50 size-8" />
            <p className="text-muted-foreground text-sm">
              No comments yet. Start the conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
