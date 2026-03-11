'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { editPost } from '@/lib/actions/post.actions';

interface EditPostDialogProps {
  postId: string;
  initialContent: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({
  postId,
  initialContent,
  open,
  onOpenChange,
}: EditPostDialogProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(initialContent);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => editPost({ postId, content }),
    onSuccess: () => {
      toast.success('Post updated');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => toast.error('Failed to update post'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="resize-none"
          placeholder="What's on your mind?"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => save()}
            disabled={!content.trim() || content === initialContent || isPending}
          >
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
