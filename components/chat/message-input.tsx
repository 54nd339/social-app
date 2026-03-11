'use client';

import { useState } from 'react';
import { ImagePlay, Loader2, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendMessage } from '@/lib/actions/chat.actions';

import { GifPicker } from './gif-picker';

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { mutate: send, isPending } = useMutation({
    mutationFn: (input?: { type?: string; mediaUrl?: string }) =>
      sendMessage({
        conversationId,
        content: input?.type === 'gif' ? undefined : content,
        type: input?.type ?? 'text',
        mediaUrl: input?.mediaUrl,
      }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  function handleGifSelect(url: string) {
    send({ type: 'gif', mediaUrl: url });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isPending) return;
    send({});
  }

  return (
    <form onSubmit={handleSubmit} className="bg-background flex items-center gap-2 border-t p-3">
      <GifPicker onSelect={handleGifSelect}>
        <Button type="button" variant="ghost" size="icon-sm">
          <ImagePlay className="size-4" />
        </Button>
      </GifPicker>
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
        disabled={isPending}
      />
      <Button type="submit" size="icon" disabled={!content.trim() || isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}
