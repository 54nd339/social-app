import { z } from 'zod/v4';

import { MAX_COMMENT_LENGTH } from '@/lib/constants';

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(MAX_COMMENT_LENGTH),
  parentId: z.string().uuid().nullable().optional(),
});

export const editCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(MAX_COMMENT_LENGTH),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type EditCommentInput = z.infer<typeof editCommentSchema>;
