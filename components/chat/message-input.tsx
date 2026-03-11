'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendMessage } from '@/lib/actions/chat.actions';

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { mutate: send, isPending } = useMutation({
    mutationFn: () =>
      sendMessage({
        conversationId,
        content,
        type: 'text',
      }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isPending) return;
    send();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-background flex items-center gap-2 border-t p-3">
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
