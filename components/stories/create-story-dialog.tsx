'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createStory } from '@/lib/actions/story.actions';
import { useUploadThing } from '@/lib/uploadthing-client';

interface CreateStoryDialogProps {
  children: React.ReactNode;
}

export function CreateStoryDialog({ children }: CreateStoryDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing('storyMedia');

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => createStory({ mediaUrl: uploadedUrl!, caption: caption || undefined }),
    onSuccess: () => {
      setOpen(false);
      setCaption('');
      setPreview(null);
      setUploadedUrl(null);
      queryClient.invalidateQueries({ queryKey: ['story-rings'] });
    },
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const res = await startUpload([file]);
      if (res?.[0]) {
        setUploadedUrl(res[0].ufsUrl);
      }
    } finally {
      setIsUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploadedUrl(null);
    setCaption('');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleClose();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative aspect-[9/16] max-h-80 w-full overflow-hidden rounded-lg">
              <Image src={preview} alt="Story preview" fill className="object-cover" />
              <Button
                variant="destructive"
                size="icon-xs"
                className="absolute top-2 right-2"
                onClick={() => {
                  URL.revokeObjectURL(preview);
                  setPreview(null);
                  setUploadedUrl(null);
                }}
              >
                <X className="size-3" />
              </Button>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="size-8 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-muted hover:bg-muted/80 flex aspect-[9/16] max-h-80 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
            >
              <ImagePlus className="text-muted-foreground size-8" />
              <span className="text-muted-foreground text-sm">Add photo or video</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Input
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <Button
            className="w-full"
            disabled={!uploadedUrl || isUploading || isPending}
            onClick={() => submit()}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Share Story'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
