'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Bell,
  Bookmark,
  Compass,
  Eye,
  EyeOff,
  Home,
  MessageCircle,
  Moon,
  PenSquare,
  Settings,
  Sun,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCommandPaletteStore } from '@/stores/command-palette.store';
import { useIncognitoStore } from '@/stores/incognito.store';
import { useZenModeStore } from '@/stores/zen-mode.store';

export function CommandPalette() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const zenToggle = useZenModeStore((s) => s.toggle);
  const incognitoToggle = useIncognitoStore((s) => s.toggle);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search Haven..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </CommandItem>
          <CommandItem onSelect={() => navigate('/explore')}>
            <Compass className="mr-2 h-4 w-4" />
            Explore
          </CommandItem>
          <CommandItem onSelect={() => navigate('/messages')}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Messages
          </CommandItem>
          <CommandItem onSelect={() => navigate('/notifications')}>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </CommandItem>
          <CommandItem onSelect={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate('/drafts')}>
            <PenSquare className="mr-2 h-4 w-4" />
            New Post
          </CommandItem>
          <CommandItem onSelect={() => navigate('/vault')}>
            <Bookmark className="mr-2 h-4 w-4" />
            Vault
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Toggles">
          <CommandItem
            onSelect={() => {
              zenToggle();
              setOpen(false);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Toggle Zen Mode
          </CommandItem>
          <CommandItem
            onSelect={() => {
              incognitoToggle();
              setOpen(false);
            }}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Toggle Incognito
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
              setOpen(false);
            }}
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle Theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
