'use client';

import Link from 'next/link';
import {
  AtSign,
  Bell,
  Heart,
  MessageCircle,
  MessageSquare,
  Repeat2,
  Shield,
  UserPlus,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { markNotificationRead } from '@/lib/actions/notification.actions';
import type { NotificationItem as NotifItem } from '@/lib/db/queries/notification.queries';
import { cn, formatRelativeTime } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: typeof Heart; label: string; color: string }> = {
  reaction: { icon: Heart, label: 'reacted to your post', color: 'text-pink-500' },
  comment: { icon: MessageCircle, label: 'commented on your post', color: 'text-blue-500' },
  follow: { icon: UserPlus, label: 'started following you', color: 'text-green-500' },
  follow_request: { icon: Shield, label: 'requested to follow you', color: 'text-amber-500' },
  mention: { icon: AtSign, label: 'mentioned you', color: 'text-purple-500' },
  message: { icon: MessageSquare, label: 'sent you a message', color: 'text-cyan-500' },
  story_reaction: { icon: Heart, label: 'reacted to your story', color: 'text-orange-500' },
  thread_reply: { icon: Repeat2, label: 'replied in your thread', color: 'text-indigo-500' },
  badge_earned: { icon: Shield, label: 'You earned a badge!', color: 'text-yellow-500' },
  report_update: { icon: Bell, label: 'Report update', color: 'text-muted-foreground' },
};

interface NotificationItemProps {
  notification: NotifItem;
}

function getNotificationHref(n: NotifItem): string {
  if (n.entityType === 'post' && n.entityId) return `/post/${n.entityId}`;
  if (n.type === 'follow' || n.type === 'follow_request') {
    return n.actor ? `/${n.actor.username}` : '/notifications';
  }
  if (n.type === 'message') return '/messages';
  return '/notifications';
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.reaction!;
  const Icon = config.icon;
  const href = getNotificationHref(notification);

  const { mutate: markRead } = useMutation({
    mutationFn: () => markNotificationRead(notification.id),
  });

  return (
    <Link
      href={href}
      onClick={() => {
        if (!notification.read) markRead();
      }}
      className={cn(
        'hover:bg-accent/50 flex items-start gap-3 border-b px-4 py-3 transition-colors',
        !notification.read && 'bg-primary/5',
      )}
    >
      <div className={cn('bg-muted mt-0.5 rounded-full p-2', config.color)}>
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {notification.actor && (
            <Avatar className="size-6">
              <AvatarImage src={notification.actor.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {notification.actor.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <p className="text-sm">
            {notification.actor && (
              <span className="font-semibold">
                {notification.actor.displayName ?? notification.actor.username}
              </span>
            )}{' '}
            <span className="text-muted-foreground">{config.label}</span>
          </p>
        </div>
        <time className="text-muted-foreground text-xs">
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>

      {!notification.read && <div className="bg-primary mt-2 size-2 shrink-0 rounded-full" />}
    </Link>
  );
}
