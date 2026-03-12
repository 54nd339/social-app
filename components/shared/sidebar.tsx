'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  Bookmark,
  CircleDashed,
  Compass,
  Eye,
  EyeOff,
  FolderHeart,
  Home,
  MessageCircle,
  PenSquare,
  Settings,
} from 'lucide-react';

import { AccountSwitcher } from '@/components/shared/account-switcher';
import { HavenLogo } from '@/components/shared/haven-logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIncognitoStore } from '@/stores/incognito.store';
import { useZenModeStore } from '@/stores/zen-mode.store';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/activity', icon: Activity, label: 'Activity' },
] as const;

const SECONDARY_ITEMS = [
  { href: '/circles', icon: CircleDashed, label: 'Circles' },
  { href: '/collections', icon: FolderHeart, label: 'Collections' },
  { href: '/drafts', icon: PenSquare, label: 'Drafts' },
  { href: '/vault', icon: Bookmark, label: 'Vault' },
  { href: '/settings', icon: Settings, label: 'Settings' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const zenMode = useZenModeStore((s) => s.enabled);
  const zenToggle = useZenModeStore((s) => s.toggle);
  const incognito = useIncognitoStore((s) => s.enabled);
  const incognitoToggle = useIncognitoStore((s) => s.toggle);

  return (
    <aside className="border-sidebar-border bg-sidebar sticky top-0 flex h-screen w-[72px] flex-col items-center gap-1 border-r py-4 lg:w-[240px]">
      <Link href="/" className="text-primary mb-4 flex items-center gap-2 px-3 text-xl font-bold">
        <HavenLogo className="h-7 w-7" />
        <span className="hidden lg:inline">Haven</span>
      </Link>

      <nav className="flex w-full flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Separator className="my-2" />

        {SECONDARY_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex w-full flex-col gap-1 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={zenToggle}
              aria-label={zenMode ? 'Turn off Zen Mode' : 'Toggle Zen Mode'}
              className={cn(
                'flex w-full items-center justify-start gap-3 px-3',
                zenMode && 'text-primary',
              )}
            >
              <Eye className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{zenMode ? 'Zen On' : 'Zen Mode'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            Zen Mode
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={incognitoToggle}
              aria-label={incognito ? 'Turn off Incognito mode' : 'Toggle Incognito mode'}
              className={cn(
                'flex w-full items-center justify-start gap-3 px-3',
                incognito && 'text-primary',
              )}
            >
              <EyeOff className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{incognito ? 'Incognito On' : 'Incognito'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            Incognito
          </TooltipContent>
        </Tooltip>

        <Separator className="my-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <AccountSwitcher />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            Profile
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
