'use client';

import { useState } from 'react';
import { Pencil, Smile, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { updateStatus } from '@/lib/actions/profile-power.actions';
import { MAX_STATUS_LENGTH } from '@/lib/constants';

interface CustomStatusProps {
  initialText: string | null;
  initialEmoji: string | null;
}

export function CustomStatus({ initialText, initialEmoji }: CustomStatusProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialText ?? '');
  const [emoji, setEmoji] = useState(initialEmoji ?? '');

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => updateStatus(text || null, emoji || null),
    onSuccess: () => {
      setOpen(false);
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const { mutate: clear } = useMutation({
    mutationFn: () => updateStatus(null, null),
    onSuccess: () => {
      setText('');
      setEmoji('');
      setOpen(false);
      toast.success('Status cleared');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors">
          {initialEmoji && <span>{initialEmoji}</span>}
          {initialText ? (
            <span className="text-muted-foreground truncate">{initialText}</span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1">
              <Smile className="size-3.5" />
              Set status
            </span>
          )}
          <Pencil className="text-muted-foreground size-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set your status</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="😊"
              maxLength={2}
              className="w-16 text-center text-lg"
            />
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={MAX_STATUS_LENGTH}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              Save
            </Button>
            {(initialText || initialEmoji) && (
              <Button type="button" variant="outline" onClick={() => clear()}>
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
