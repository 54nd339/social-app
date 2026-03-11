'use client';

import Image from 'next/image';
import {
  Calendar,
  Flag,
  Link as LinkIcon,
  Lock,
  MapPin,
  MoreHorizontal,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { ReportDialog } from '@/components/shared/report-dialog';
import { ZenMetric } from '@/components/shared/zen-metric';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { restrictUser, unrestrictUser } from '@/lib/actions/profile-power.actions';
import type { ProfileData } from '@/lib/db/queries/profile.queries';

import { FollowButton } from './follow-button';

interface ProfileHeaderProps {
  profile: ProfileData;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const isSelf = profile.followStatus === 'self';

  const { mutate: handleRestrict } = useMutation({
    mutationFn: () => restrictUser(profile.id),
    onSuccess: () => toast.success(`Restricted @${profile.username}`),
    onError: (err: Error) => toast.error(err.message),
  });

  const { mutate: handleUnrestrict } = useMutation({
    mutationFn: () => unrestrictUser(profile.id),
    onSuccess: () => toast.success(`Unrestricted @${profile.username}`),
    onError: (err: Error) => toast.error(err.message),
  });

  function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
    toast.success('Profile link copied');
  }

  return (
    <div>
      <div className="from-primary/20 via-primary/10 to-primary/5 relative h-32 bg-gradient-to-r sm:h-48">
        {profile.bannerUrl && (
          <Image
            src={profile.bannerUrl}
            alt="Profile banner"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="relative px-4 pb-4">
        <div className="flex items-end justify-between">
          <Avatar className="border-background -mt-12 size-20 border-4 sm:-mt-16 sm:size-28">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.username} />
            <AvatarFallback className="text-2xl sm:text-3xl">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2 pt-3">
            <Button variant="outline" size="icon-sm" onClick={handleShare}>
              <Share2 className="size-4" />
            </Button>

            {isSelf ? (
              <Button variant="outline" size="sm">
                Edit profile
              </Button>
            ) : (
              <>
                <FollowButton userId={profile.id} initialStatus={profile.followStatus} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon-sm">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRestrict()}>
                      <ShieldAlert className="size-4" />
                      Restrict @{profile.username}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUnrestrict()}>
                      <ShieldAlert className="size-4" />
                      Unrestrict @{profile.username}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <ReportDialog entityId={profile.id} entityType="user">
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive"
                      >
                        <Flag className="size-4" />
                        Report @{profile.username}
                      </DropdownMenuItem>
                    </ReportDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{profile.displayName ?? profile.username}</h1>
              {profile.isPrivate && (
                <Badge variant="secondary" className="text-[10px]">
                  <Lock className="mr-0.5 size-2.5" />
                  Private
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>

          {profile.statusText && (
            <p className="text-sm">
              {profile.statusEmoji && <span className="mr-1">{profile.statusEmoji}</span>}
              {profile.statusText}
            </p>
          )}

          {profile.bio && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          )}

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 hover:underline"
              >
                <LinkIcon className="size-3" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              Joined{' '}
              {new Date(profile.createdAt).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button className="hover:underline">
              <span className="font-semibold">
                <ZenMetric value={profile.followingCount} fallback="—" />
              </span>{' '}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button className="hover:underline">
              <span className="font-semibold">
                <ZenMetric value={profile.followerCount} fallback="—" />
              </span>{' '}
              <span className="text-muted-foreground">Followers</span>
            </button>
            <span className="text-muted-foreground">
              <span className="text-foreground font-semibold">
                <ZenMetric value={profile.postCount} fallback="—" />
              </span>{' '}
              Posts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
