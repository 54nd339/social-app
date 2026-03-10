'use client';

import { EyeOff, Flame, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCommandPaletteStore } from '@/stores/command-palette.store';
import { useIncognitoStore } from '@/stores/incognito.store';

export function Navbar() {
  const openPalette = useCommandPaletteStore((s) => s.toggle);
  const incognito = useIncognitoStore((s) => s.enabled);

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm md:hidden">
      <div className="flex items-center gap-2">
        <Flame className="text-primary h-6 w-6" />
        <span className="text-foreground text-lg font-bold">Haven</span>
        {incognito && <EyeOff className="text-muted-foreground h-4 w-4" />}
      </div>
      <Button variant="ghost" size="icon" onClick={openPalette}>
        <Search className="h-5 w-5" />
      </Button>
    </header>
  );
}
