'use client';

import { Download, QrCode } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QRCodeDialogProps {
  username: string;
  children?: React.ReactNode;
}

export function QRCodeDialog({ username, children }: QRCodeDialogProps) {
  const qrUrl = `/api/qr/${username}`;

  async function downloadQR() {
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}-haven-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <QrCode className="size-3.5" />
            QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Profile QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR code for @${username}`} className="size-48" />
          <p className="text-muted-foreground text-sm">@{username}</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={downloadQR}>
            <Download className="size-4" />
            Download SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
