import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
}

export function LinkPreview({ url, title, description, imageUrl, siteName }: LinkPreviewProps) {
  if (!title && !description) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group hover:bg-accent/50 flex overflow-hidden rounded-lg border transition-colors"
    >
      {imageUrl && (
        <div className="relative hidden w-32 shrink-0 sm:block">
          <Image src={imageUrl} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        {siteName && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <ExternalLink className="size-3" />
            {siteName}
          </span>
        )}
        {title && (
          <p className="group-hover:text-primary line-clamp-2 text-sm font-medium">{title}</p>
        )}
        {description && <p className="text-muted-foreground line-clamp-2 text-xs">{description}</p>}
      </div>
    </a>
  );
}
