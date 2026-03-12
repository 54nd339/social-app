'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Plus, User } from 'lucide-react';
import { useClerk, useUser } from '@clerk/nextjs';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AccountSwitcher() {
  const { user } = useUser();
  const { signOut, openSignIn } = useClerk();
  const router = useRouter();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.imageUrl} alt={user.username ?? 'Profile'} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 flex-col text-left lg:flex">
            <span className="text-sidebar-foreground truncate text-sm font-medium">
              {user.fullName ?? 'Profile'}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              @{user.username ?? '...'}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuItem onClick={() => router.push(`/${user.username}`)} className="gap-2">
          <User className="size-4" />
          View profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => openSignIn({ forceRedirectUrl: '/' })} className="gap-2">
          <Plus className="size-4" />
          Add another account
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
          className="text-destructive gap-2"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
