'use client';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

import type { OgData } from '@/lib/og-scraper';

interface LinkPreviewProps {
  data: OgData;
}

export function LinkPreview({ data }: LinkPreviewProps) {
  const hostname = (() => {
    try {
      return new URL(data.url).hostname;
    } catch {
      return data.siteName ?? data.url;
    }
  })();

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:bg-accent/50 mt-2 flex overflow-hidden rounded-lg border transition-colors"
    >
      {data.imageUrl && (
        <div className="relative aspect-square w-24 shrink-0 sm:w-32">
          <Image
            src={data.imageUrl}
            alt={data.title ?? ''}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-3">
        <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
          <ExternalLink className="size-2.5" />
          {hostname}
        </p>
        {data.title && <p className="line-clamp-1 text-sm font-medium">{data.title}</p>}
        {data.description && (
          <p className="text-muted-foreground line-clamp-2 text-xs">{data.description}</p>
        )}
      </div>
    </a>
  );
}
