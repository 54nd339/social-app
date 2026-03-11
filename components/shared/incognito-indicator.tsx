'use client';

import { EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIncognitoStore } from '@/stores/incognito.store';

export function IncognitoIndicator({ className }: { className?: string }) {
  const enabled = useIncognitoStore((s) => s.enabled);

  if (!enabled) return null;

  return (
    <div
      className={cn(
        'bg-muted text-muted-foreground flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
        className,
      )}
    >
      <EyeOff className="size-3" />
      <span>Incognito</span>
    </div>
  );
}
