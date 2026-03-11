import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { postEditHistory, posts, users } from '@/lib/db/schema';

export interface EditHistoryItem {
  id: string;
  previousContent: string;
  editedAt: Date;
}

export interface PostWithHistory {
  id: string;
  content: string;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  history: EditHistoryItem[];
}

export async function getPostEditHistory(postId: string): Promise<PostWithHistory | null> {
  const [post] = await db
    .select({
      id: posts.id,
      content: posts.content,
      isEdited: posts.isEdited,
      editedAt: posts.editedAt,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) return null;

  const [author] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, post.authorId))
    .limit(1);

  if (!author) return null;

  const history = await db
    .select({
      id: postEditHistory.id,
      previousContent: postEditHistory.previousContent,
      editedAt: postEditHistory.editedAt,
    })
    .from(postEditHistory)
    .where(eq(postEditHistory.postId, postId))
    .orderBy(desc(postEditHistory.editedAt));

  return {
    id: post.id,
    content: post.content,
    isEdited: post.isEdited,
    editedAt: post.editedAt,
    createdAt: post.createdAt,
    author,
    history,
  };
}
