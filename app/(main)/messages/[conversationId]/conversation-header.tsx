'use client';

import Link from 'next/link';
import { ArrowLeft, ImageIcon, Phone, Video } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { MediaGallery } from '@/components/chat/media-gallery';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConversationPreview } from '@/lib/db/queries/chat.queries';

interface ConversationHeaderProps {
  conversationId: string;
}

export function ConversationHeader({ conversationId }: ConversationHeaderProps) {
  const { data: conversations } = useQuery<ConversationPreview[]>({
    queryKey: ['conversations'],
  });

  const conv = conversations?.find((c) => c.id === conversationId);

  const displayName =
    conv?.type === 'direct' && conv.otherUser
      ? (conv.otherUser.displayName ?? conv.otherUser.username)
      : (conv?.name ?? 'Chat');
  const avatar =
    conv?.type === 'direct' && conv.otherUser ? conv.otherUser.avatarUrl : conv?.avatarUrl;
  const username = conv?.type === 'direct' && conv.otherUser ? conv.otherUser.username : null;

  return (
    <div className="bg-background/80 flex items-center gap-3 border-b px-3 py-2.5 backdrop-blur-sm">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href="/messages">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      {conv ? (
        <Link
          href={username ? `/${username}` : '#'}
          className="flex min-w-0 flex-1 items-center gap-2.5"
        >
          <Avatar className="size-9">
            <AvatarImage src={avatar ?? undefined} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            {username && <p className="text-muted-foreground truncate text-xs">@{username}</p>}
          </div>
        </Link>
      ) : (
        <div className="flex flex-1 items-center gap-2.5">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Shared media">
              <ImageIcon className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0 sm:w-96">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Shared Media</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto">
              <MediaGallery conversationId={conversationId} />
            </div>
          </SheetContent>
        </Sheet>
        <Button variant="ghost" size="icon-sm" disabled>
          <Phone className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" disabled>
          <Video className="size-4" />
        </Button>
      </div>
    </div>
  );
}
