'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ImagePlay, ImagePlus, Loader2, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendMessage } from '@/lib/actions/chat.actions';
import { useUploadThing } from '@/lib/uploadthing-client';

const GifPicker = dynamic(() => import('./gif-picker').then((m) => m.GifPicker), {
  ssr: false,
  loading: () => <div className="bg-muted h-40 animate-pulse rounded-lg" />,
});

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing('chatImage');

  const { mutate: send, isPending } = useMutation({
    mutationFn: (input?: { type?: string; mediaUrl?: string }) =>
      sendMessage({
        conversationId,
        content: input?.type === 'gif' || input?.type === 'image' ? undefined : content,
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

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await startUpload([file]);
      if (res?.[0]) {
        send({ type: 'image', mediaUrl: res[0].ufsUrl });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isPending) return;
    send({});
  }

  const busy = isPending || isUploading;

  return (
    <form onSubmit={handleSubmit} className="bg-background flex items-center gap-2 border-t p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload image"
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
      </Button>
      <GifPicker onSelect={handleGifSelect}>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Send GIF">
          <ImagePlay className="size-4" />
        </Button>
      </GifPicker>
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
        disabled={busy}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || busy}
        aria-label="Send message"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}
