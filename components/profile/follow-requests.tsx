'use client';

import { Check, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { acceptFollowRequest, rejectFollowRequest } from '@/lib/actions/social.actions';

interface FollowRequest {
  id: string;
  requesterId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

async function fetchRequests(): Promise<FollowRequest[]> {
  const res = await fetch('/api/profile/follow-requests');
  if (!res.ok) return [];
  return res.json();
}

export function FollowRequests() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ['follow-requests'],
    queryFn: fetchRequests,
  });

  const { mutate: accept } = useMutation({
    mutationFn: (requesterId: string) => acceptFollowRequest(requesterId),
    onSuccess: () => {
      toast.success('Request accepted');
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    },
    onError: () => toast.error('Failed to accept'),
  });

  const { mutate: reject } = useMutation({
    mutationFn: (requesterId: string) => rejectFollowRequest(requesterId),
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
    },
    onError: () => toast.error('Failed to reject'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) return null;

  return (
    <div className="border-b px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <UserPlus className="size-4" />
        Follow requests ({requests.length})
      </div>
      <div className="space-y-2">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage src={req.avatarUrl ?? undefined} />
              <AvatarFallback>{req.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{req.displayName ?? req.username}</p>
              <p className="text-muted-foreground truncate text-xs">@{req.username}</p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-green-600"
              onClick={() => accept(req.requesterId)}
            >
              <Check className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => reject(req.requesterId)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
