'use client';

import { useState } from 'react';
import { Check, Code, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShareSheetProps {
  url: string;
  title?: string;
  embedCode?: string;
  onShared?: () => void;
  children?: React.ReactNode;
}

export function ShareSheet({ url, title, embedCode, onShared, children }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied');
  }

  async function copyEmbed() {
    if (!embedCode) return;
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
    toast.success('Embed code copied');
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      onShared?.();
      return;
    }
    try {
      await navigator.share({ title: title ?? 'Check this out on Haven', url });
      onShared?.();
    } catch {
      /* user cancelled */
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon-sm">
            <Share2 className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Link</Label>
            <div className="flex gap-2">
              <Input value={url} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={nativeShare}>
            <Share2 className="size-4" />
            Share via...
          </Button>

          {embedCode && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Code className="size-3.5" />
                Embed code
              </Label>
              <div className="flex gap-2">
                <Input value={embedCode} readOnly className="font-mono text-[10px]" />
                <Button variant="outline" size="icon" onClick={copyEmbed}>
                  {embedCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
