'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Edit3, Eye, MessageCircle, MoreHorizontal, Share2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { LinkPreview } from '@/components/feed/link-preview';
import { MediaGallery } from '@/components/feed/media-gallery';
import { PollCard } from '@/components/feed/poll-card';
import { ReactionBar } from '@/components/feed/reaction-bar';
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
import { Separator } from '@/components/ui/separator';
import { bookmarkPost, deletePost } from '@/lib/actions/post.actions';

interface PostDetailCardProps {
  post: {
    id: string;
    content: string;
    visibility: string;
    contentWarning: string | null;
    isEdited: boolean;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    collabUser: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
    media: Array<{
      id: string;
      url: string;
      type: string;
      blurhash: string | null;
      width: number | null;
      height: number | null;
      order: number;
    }>;
    linkPreview: {
      url: string;
      title: string | null;
      description: string | null;
      imageUrl: string | null;
      siteName: string | null;
    } | null;
    poll: {
      id: string;
      question: string;
      expiresAt: Date | null;
      options: Array<{
        id: string;
        text: string;
        order: number;
      }>;
    } | null;
  };
  currentUserId: string;
}

export function PostDetailCard({ post, currentUserId }: PostDetailCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isAuthor = post.author.id === currentUserId;

  const { mutate: handleBookmark } = useMutation({
    mutationFn: () => bookmarkPost(post.id),
    onSuccess: (result) => {
      toast.success(result.bookmarked ? 'Saved to collection' : 'Removed from collection');
    },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      router.push('/');
    },
  });

  return (
    <article className="p-4">
      <div className="flex items-start gap-3">
        <Link href={`/${post.author.username}`}>
          <Avatar className="size-12">
            <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.username} />
            <AvatarFallback>{post.author.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/${post.author.username}`}
                className="text-sm font-semibold hover:underline"
              >
                {post.author.displayName ?? post.author.username}
              </Link>
              <Link
                href={`/${post.author.username}`}
                className="text-muted-foreground block text-sm"
              >
                @{post.author.username}
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBookmark()}>
                  <Bookmark className="size-4" />
                  Save
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied');
                  }}
                >
                  <Share2 className="size-4" />
                  Copy link
                </DropdownMenuItem>
                {isAuthor && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit3 className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete()}>
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
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
        </div>
      </div>

      {post.visibility !== 'public' && (
        <Badge variant="secondary" className="mt-2 text-[10px]">
          <Eye className="mr-0.5 size-2.5" />
          {post.visibility}
        </Badge>
      )}

      <div className="mt-4 space-y-3">
        {post.contentWarning && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            CW: {post.contentWarning}
          </div>
        )}

        <p className="text-base leading-relaxed break-words whitespace-pre-wrap">{post.content}</p>

        {post.media.length > 0 && <MediaGallery media={post.media} />}
        {post.linkPreview && <LinkPreview {...post.linkPreview} />}
        {post.poll && (
          <PollCard
            question={post.poll.question}
            options={post.poll.options.map((o) => ({ ...o, voteCount: 0 }))}
            expiresAt={post.poll.expiresAt}
            userVotedOptionId={null}
          />
        )}
      </div>

      <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
        <time dateTime={new Date(post.createdAt).toISOString()}>
          {new Date(post.createdAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </time>
        {post.isEdited && <span>· Edited</span>}
      </div>

      <Separator className="my-3" />

      <div className="flex items-center gap-1">
        <ReactionBar entityId={post.id} entityType="post" reactionCounts={{}} userReaction={null} />

        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs">
          <MessageCircle className="size-4" />
          Comments
        </Button>

        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs">
          <Share2 className="size-4" />
          Share
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={() => handleBookmark()}
        >
          <Bookmark className="size-4" />
        </Button>
      </div>
    </article>
  );
}
