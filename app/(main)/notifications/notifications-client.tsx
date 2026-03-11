'use client';

import { CheckCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { NotificationList } from '@/components/notifications';
import { FollowRequests } from '@/components/profile/follow-requests';
import { Button } from '@/components/ui/button';
import { markAllNotificationsRead } from '@/lib/actions/notification.actions';

interface NotificationsClientProps {
  userId?: string;
}

export function NotificationsClient({ userId }: NotificationsClientProps) {
  const queryClient = useQueryClient();

  const { mutate: markAll, isPending } = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Notifications</h1>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => markAll()}>
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </div>

      <FollowRequests />
      <NotificationList userId={userId} />
    </div>
  );
}
