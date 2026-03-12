'use client';

import { Search } from 'lucide-react';

import { HavenLogo } from '@/components/shared/haven-logo';
import { IncognitoIndicator } from '@/components/shared/incognito-indicator';
import { Button } from '@/components/ui/button';
import { useCommandPaletteStore } from '@/stores/command-palette.store';

export function Navbar() {
  const openPalette = useCommandPaletteStore((s) => s.toggle);

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm md:hidden">
      <div className="flex items-center gap-2">
        <HavenLogo className="text-primary h-6 w-6" />
        <span className="text-foreground text-lg font-bold">Haven</span>
        <IncognitoIndicator />
      </div>
      <Button variant="ghost" size="icon" onClick={openPalette} aria-label="Open search">
        <Search className="h-5 w-5" />
      </Button>
    </header>
  );
}
