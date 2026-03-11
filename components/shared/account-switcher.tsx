'use client';

import { Check, LogOut, Plus } from 'lucide-react';
import { useClerk, useUser } from '@clerk/nextjs';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto gap-2 px-2 py-1.5">
          <Avatar className="size-6">
            <AvatarImage src={user.imageUrl} alt={user.username ?? ''} />
            <AvatarFallback className="text-[10px]">
              {user.username?.charAt(0).toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-xs lg:inline">@{user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-8">
            <AvatarImage src={user.imageUrl} />
            <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.fullName ?? user.username}</p>
            <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
          </div>
          <Check className="text-primary size-4 shrink-0" />
        </div>

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
