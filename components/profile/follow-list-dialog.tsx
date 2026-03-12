'use client';

import Link from 'next/link';
import { UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { removeFollower } from '@/lib/actions/social.actions';
import type { FollowUser } from '@/lib/db/queries/profile.queries';

interface FollowListDialogProps {
  username: string;
  type: 'followers' | 'following';
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowListDialog({
  username,
  type,
  isSelf,
  open,
  onOpenChange,
}: FollowListDialogProps) {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<FollowUser[]>({
    queryKey: ['follow-list', username, type],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/${type}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: open,
  });

  const { mutate: handleRemove } = useMutation({
    mutationFn: (followerId: string) => removeFollower(followerId),
    onSuccess: () => {
      toast.success('Follower removed');
      queryClient.invalidateQueries({ queryKey: ['follow-list', username, 'followers'] });
    },
    onError: () => toast.error('Failed to remove follower'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{type === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && users?.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
        )}

        <div className="space-y-1">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-md p-2">
              <Link
                href={`/${user.username}`}
                className="flex items-center gap-3"
                onClick={() => onOpenChange(false)}
              >
                <Avatar className="size-9">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user.displayName ?? user.username}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
                </div>
              </Link>
              <div className="ml-auto">
                {isSelf && type === 'followers' && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(user.id)}
                    title="Remove follower"
                  >
                    <UserMinus className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
