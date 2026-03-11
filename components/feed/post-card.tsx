'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  ChevronDown,
  Edit3,
  Eye,
  Flag,
  FolderPlus,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Share2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EditIndicator } from '@/components/shared/edit-indicator';
import { ReportDialog } from '@/components/shared/report-dialog';
import { ShareSheet } from '@/components/shared/share-sheet';
import { ZenMetric } from '@/components/shared/zen-metric';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bookmarkPost, deletePost, sharePost } from '@/lib/actions/post.actions';
import { pinPost, unpinPost } from '@/lib/actions/profile-power.actions';
import type { FeedPost } from '@/lib/db/queries/post.queries';
import { cn, formatRelativeTime } from '@/lib/utils';

import { EditPostDialog } from './edit-post-dialog';
import { LinkPreview } from './link-preview';
import { MediaGallery } from './media-gallery';
import { PollCard } from './poll-card';
import { ReactionBar } from './reaction-bar';
import { SaveToCollectionSheet } from './save-to-collection-sheet';

interface PostCardProps {
  post: FeedPost;
}

export function PostCard({ post }: PostCardProps) {
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCW, setShowCW] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const isAuthor = clerkUser?.id === post.author.id;
  const hasCW = !!post.contentWarning;
  const shouldTruncate = post.content.length > 500;
  const displayContent =
    shouldTruncate && !isExpanded ? `${post.content.slice(0, 500)}...` : post.content;

  const { mutate: handleBookmark } = useMutation({
    mutationFn: () => bookmarkPost(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previous = queryClient.getQueryData<{
        pages: { posts: FeedPost[]; nextCursor: string | null }[];
      }>(['feed']);
      queryClient.setQueryData(
        ['feed'],
        (old: { pages: { posts: FeedPost[]; nextCursor: string | null }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) =>
                p.id === post.id ? { ...p, isBookmarked: !(p.isBookmarked ?? false) } : p,
              ),
            })),
          };
        },
      );
      return { previous };
    },
    onSuccess: (result) => {
      toast.success(result.bookmarked ? 'Saved to collection' : 'Removed from collection');
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['feed'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const { mutate: handlePin } = useMutation({
    mutationFn: () => (post.isPinned ? unpinPost(post.id) : pinPost(post.id)),
    onSuccess: () => {
      toast.success(post.isPinned ? 'Unpinned from profile' : 'Pinned to profile');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: trackShare } = useMutation({
    mutationFn: () => sharePost(post.id),
  });

  return (
    <article className="bg-card hover:bg-card/80 border-b transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/${post.author.username}`}>
            <Avatar className="size-10">
              <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.username} />
              <AvatarFallback>{post.author.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${post.author.username}`}
                  className="truncate text-sm font-semibold hover:underline"
                >
                  {post.author.displayName ?? post.author.username}
                </Link>
                <Link
                  href={`/${post.author.username}`}
                  className="text-muted-foreground truncate text-sm"
                >
                  @{post.author.username}
                </Link>
                <span className="text-muted-foreground">·</span>
                <time
                  className="text-muted-foreground shrink-0 text-xs"
                  dateTime={
                    post.createdAt.toISOString?.() ?? new Date(post.createdAt).toISOString()
                  }
                >
                  {formatRelativeTime(post.createdAt)}
                </time>
                {post.isEdited && post.editedAt && (
                  <EditIndicator postId={post.id} editedAt={post.editedAt} />
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBookmark()}>
                    <Bookmark className="size-4" />
                    Save
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCollectionOpen(true)}>
                    <FolderPlus className="size-4" />
                    Save to collection
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                      toast.success('Link copied');
                    }}
                  >
                    <Share2 className="size-4" />
                    Copy link
                  </DropdownMenuItem>
                  {isAuthor && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Edit3 className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePin()}>
                        <Pin className="size-4" />
                        {post.isPinned ? 'Unpin from profile' : 'Pin to profile'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete()}>
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isAuthor && (
                    <>
                      <DropdownMenuSeparator />
                      <ReportDialog entityId={post.id} entityType="post">
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive"
                        >
                          <Flag className="size-4" />
                          Report
                        </DropdownMenuItem>
                      </ReportDialog>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {post.collabUser && (
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <span>with</span>
                <Link href={`/${post.collabUser.username}`} className="font-medium hover:underline">
                  @{post.collabUser.username}
                </Link>
              </div>
            )}

            {post.visibility !== 'public' && (
              <Badge variant="secondary" className="mt-1 text-[10px]">
                <Eye className="mr-0.5 size-2.5" />
                {post.visibility}
              </Badge>
            )}

            <div className="mt-2">
              {hasCW && !showCW ? (
                <button
                  className="flex w-full items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-left text-sm dark:border-amber-900/50 dark:bg-amber-950/30"
                  onClick={() => setShowCW(true)}
                >
                  <Eye className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-300">
                      Content warning
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {post.contentWarning}
                    </p>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {displayContent}
                  </p>

                  {shouldTruncate && (
                    <button
                      className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                      <ChevronDown
                        className={cn('size-3 transition-transform', isExpanded && 'rotate-180')}
                      />
                    </button>
                  )}

                  {post.media.length > 0 && <MediaGallery media={post.media} />}

                  {post.linkPreview && <LinkPreview {...post.linkPreview} />}

                  {post.poll && (
                    <PollCard
                      question={post.poll.question}
                      options={post.poll.options}
                      expiresAt={post.poll.expiresAt}
                      userVotedOptionId={post.poll.userVotedOptionId}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1">
              <ReactionBar
                entityId={post.id}
                entityType="post"
                reactionCounts={post.reactionCounts}
                userReaction={post.userReaction}
              />

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1.5 text-xs"
                asChild
              >
                <Link href={`/post/${post.id}`}>
                  <MessageCircle className="size-4" />
                  <ZenMetric value={post.commentCount} />
                </Link>
              </Button>

              <ShareSheet
                url={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/post/${post.id}`
                    : `/post/${post.id}`
                }
                title={`Post by @${post.author.username}`}
                onShared={() => trackShare()}
              >
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs">
                  <Share2 className="size-4" />
                  <ZenMetric value={post.shareCount} />
                </Button>
              </ShareSheet>

              <div className="flex-1" />

              <Button
                variant="ghost"
                size="icon-sm"
                className={cn('text-muted-foreground', post.isBookmarked && 'text-primary')}
                onClick={() => handleBookmark()}
              >
                <Bookmark className={cn('size-4', post.isBookmarked && 'fill-current')} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EditPostDialog
        postId={post.id}
        initialContent={post.content}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <SaveToCollectionSheet
        postId={post.id}
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
      />
    </article>
  );
}
