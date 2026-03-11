import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { posts, users } from '@/lib/db/schema';

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  const [post] = await db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      visibility: posts.visibility,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post || post.visibility !== 'public') {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const [author] = await db
    .select({ username: users.username, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, post.authorId))
    .limit(1);

  if (!author) {
    return NextResponse.json({ error: 'Author not found' }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://haven.social';
  const postUrl = `${baseUrl}/post/${postId}`;
  const authorName = author.displayName ?? author.username;

  if (format === 'json') {
    return NextResponse.json({
      version: '1.0',
      type: 'rich',
      provider_name: 'Haven',
      provider_url: baseUrl,
      author_name: authorName,
      author_url: `${baseUrl}/${author.username}`,
      title: `Post by ${authorName}`,
      html: `<blockquote class="haven-post"><p>${post.content.slice(0, 500)}</p><cite>&mdash; ${authorName} on <a href="${postUrl}">Haven</a></cite></blockquote>`,
      width: 550,
      height: null,
      cache_age: 86400,
    });
  }

  return NextResponse.json({
    postId: post.id,
    content: post.content.slice(0, 500),
    author: authorName,
    authorUsername: author.username,
    url: postUrl,
    createdAt: post.createdAt,
  });
}
