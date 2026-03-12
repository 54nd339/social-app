'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Camera,
  Flag,
  Link as LinkIcon,
  Loader2,
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
import { updateAvatar, updateBanner } from '@/lib/actions/settings.actions';
import type { ProfileData } from '@/lib/db/queries/profile.queries';
import { useUploadThing } from '@/lib/uploadthing/client';

import { FollowButton } from './follow-button';
import { FollowListDialog } from './follow-list-dialog';

interface ProfileHeaderProps {
  profile: ProfileData;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const isSelf = profile.followStatus === 'self';
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { startUpload: startAvatarUpload } = useUploadThing('avatarImage');
  const { startUpload: startBannerUpload } = useUploadThing('bannerImage');

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await startAvatarUpload([file]);
      if (res?.[0]) {
        await updateAvatar(res[0].ufsUrl);
        toast.success('Avatar updated');
      }
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const res = await startBannerUpload([file]);
      if (res?.[0]) {
        await updateBanner(res[0].ufsUrl);
        toast.success('Banner updated');
      }
    } catch {
      toast.error('Failed to upload banner');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  }

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
      <div className="from-primary/20 via-primary/10 to-primary/5 group/banner relative h-32 bg-gradient-to-r sm:h-48">
        {profile.bannerUrl && (
          <Image
            src={profile.bannerUrl}
            alt="Profile banner"
            fill
            unoptimized
            className="object-cover"
            priority
          />
        )}
        {isSelf && (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/0 transition-colors group-hover/banner:bg-black/30"
            >
              {isUploadingBanner ? (
                <Loader2 className="size-8 animate-spin text-white" />
              ) : (
                <Camera className="size-8 text-white opacity-0 transition-opacity group-hover/banner:opacity-100" />
              )}
            </button>
          </>
        )}
      </div>

      <div className="relative px-4 pb-4">
        <div className="flex items-end justify-between">
          <div className="group/avatar relative">
            <Avatar className="border-background -mt-12 size-20 border-4 sm:-mt-16 sm:size-28">
              <AvatarImage
                src={profile.avatarUrl ?? undefined}
                alt={profile.username}
                className={profile.avatarUrl?.endsWith('.gif') ? '[image-rendering:auto]' : ''}
              />
              <AvatarFallback className="text-2xl sm:text-3xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isSelf && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 -mt-12 flex cursor-pointer items-center justify-center rounded-full bg-black/0 transition-colors group-hover/avatar:bg-black/30 sm:-mt-16"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="size-5 animate-spin text-white" />
                  ) : (
                    <Camera className="size-5 text-white opacity-0 transition-opacity group-hover/avatar:opacity-100" />
                  )}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 pt-3">
            <Button variant="outline" size="icon-sm" onClick={handleShare}>
              <Share2 className="size-4" />
            </Button>

            {isSelf ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">Edit profile</Link>
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
            <button className="hover:underline" onClick={() => setFollowListType('following')}>
              <span className="font-semibold">
                <ZenMetric value={profile.followingCount} fallback="—" />
              </span>{' '}
              <span className="text-muted-foreground">Following</span>
            </button>
            <button className="hover:underline" onClick={() => setFollowListType('followers')}>
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

          <FollowListDialog
            username={profile.username}
            type={followListType ?? 'followers'}
            isSelf={isSelf}
            open={followListType !== null}
            onOpenChange={(open) => {
              if (!open) setFollowListType(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
