'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { updateProfileSettings } from '@/lib/actions/settings.actions';
import { type ProfileSettingsInput, profileSettingsSchema } from '@/lib/validators/settings';

interface ProfileSettingsProps {
  initialData: {
    displayName: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    statusText: string | null;
    statusEmoji: string | null;
  };
}

export function ProfileSettings({ initialData }: ProfileSettingsProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileSettingsInput>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      displayName: initialData.displayName ?? '',
      bio: initialData.bio ?? '',
      location: initialData.location ?? '',
      website: initialData.website ?? '',
      statusText: initialData.statusText ?? '',
      statusEmoji: initialData.statusEmoji ?? '',
    },
  });

  function onSubmit(data: ProfileSettingsInput) {
    startTransition(async () => {
      try {
        await updateProfileSettings(data);
        toast.success('Profile updated');
      } catch {
        toast.error('Failed to update profile');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-muted-foreground text-sm">Manage your public profile information</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" {...register('displayName')} placeholder="Your name" />
          {errors.displayName && (
            <p className="text-destructive text-xs">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" {...register('bio')} placeholder="Tell us about yourself" rows={3} />
          {errors.bio && <p className="text-destructive text-xs">{errors.bio.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register('location')} placeholder="Where are you based?" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            {...register('website')}
            placeholder="https://yoursite.com"
            type="url"
          />
          {errors.website && <p className="text-destructive text-xs">{errors.website.message}</p>}
        </div>

        <Separator />

        <div className="grid grid-cols-[60px_1fr] gap-3">
          <div className="space-y-2">
            <Label htmlFor="statusEmoji">Emoji</Label>
            <Input
              id="statusEmoji"
              {...register('statusEmoji')}
              placeholder="🎯"
              className="text-center"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statusText">Status</Label>
            <Input id="statusText" {...register('statusText')} placeholder="What are you up to?" />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={!isDirty || isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Save changes'}
      </Button>
    </form>
  );
}
