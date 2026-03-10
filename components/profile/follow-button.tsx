'use client';

import { useMutation } from '@tanstack/react-query';
import { Check, Clock, Loader2, UserPlus, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { followUser, unfollowUser } from '@/lib/actions/social.actions';

interface FollowButtonProps {
  userId: string;
  initialStatus: 'none' | 'following' | 'pending' | 'self';
}

export function FollowButton({ userId, initialStatus }: FollowButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isHovering, setIsHovering] = useState(false);

  const { mutate: follow, isPending: isFollowPending } = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: (result) => {
      setStatus(result.status === 'accepted' ? 'following' : 'pending');
      toast.success(result.status === 'accepted' ? 'Following!' : 'Follow request sent');
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: unfollow, isPending: isUnfollowPending } = useMutation({
    mutationFn: () => unfollowUser(userId),
    onSuccess: () => {
      setStatus('none');
      toast.success('Unfollowed');
      router.refresh();
    },
  });

  if (status === 'self') return null;

  const isPending = isFollowPending || isUnfollowPending;

  if (status === 'none') {
    return (
      <Button size="sm" disabled={isPending} onClick={() => follow()}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Follow
      </Button>
    );
  }

  if (status === 'pending') {
    return (
      <Button variant="outline" size="sm" disabled={isPending} onClick={() => unfollow()}>
        <Clock className="size-4" />
        Requested
      </Button>
    );
  }

  return (
    <Button
      variant={isHovering ? 'destructive' : 'outline'}
      size="sm"
      disabled={isPending}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => unfollow()}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isHovering ? (
        <>
          <UserX className="size-4" />
          Unfollow
        </>
      ) : (
        <>
          <Check className="size-4" />
          Following
        </>
      )}
    </Button>
  );
}
