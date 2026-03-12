'use client';

import { useCallback, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

import { HavenLogo } from '@/components/shared/haven-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { checkUsernameAvailability, completeOnboarding } from '@/lib/actions/user.actions';
import { cn } from '@/lib/utils';
import { type OnboardingInput, onboardingSchema } from '@/lib/validators/user';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

const INTEREST_SUGGESTIONS = [
  'Technology',
  'Art',
  'Music',
  'Photography',
  'Gaming',
  'Travel',
  'Fitness',
  'Cooking',
  'Reading',
  'Science',
  'Design',
  'Film',
  'Writing',
  'Nature',
  'Fashion',
] as const;

interface OnboardingFormProps {
  defaultUsername: string;
}

export function OnboardingForm({ defaultUsername }: OnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle',
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: defaultUsername,
      displayName: '',
      bio: '',
      interests: [],
    },
  });

  const [_isCheckingUsername, startUsernameCheck] = useTransition();

  const handleUsernameChange = useCallback(
    (value: string) => {
      if (!value || value.length < 3 || !/^[a-zA-Z0-9_]+$/.test(value)) {
        setUsernameStatus('idle');
        return;
      }

      setUsernameStatus('checking');
      startUsernameCheck(async () => {
        try {
          const { available } = await checkUsernameAvailability(value);
          setUsernameStatus(available ? 'available' : 'taken');
        } catch {
          setUsernameStatus('idle');
        }
      });
    },
    [startUsernameCheck],
  );

  const debouncedUsernameCheck = useDebouncedCallback(handleUsernameChange, 500);

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) => {
      const next = prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 10
          ? [...prev, interest]
          : prev;
      form.setValue('interests', next);
      return next;
    });
  }

  function onSubmit(data: OnboardingInput) {
    if (usernameStatus === 'taken') {
      form.setError('username', { message: 'Username is already taken' });
      return;
    }

    startTransition(async () => {
      try {
        await completeOnboarding({ ...data, interests: selectedInterests });
        toast.success('Welcome to Haven!');
        router.push('/');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Something went wrong');
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">@</span>
          <Input
            id="username"
            className="pl-8"
            placeholder="your_username"
            {...form.register('username', {
              onChange: (e) => debouncedUsernameCheck(e.target.value),
            })}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {usernameStatus === 'checking' && (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
            {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
            {usernameStatus === 'taken' && <X className="text-destructive h-4 w-4" />}
          </div>
        </div>
        {form.formState.errors.username && (
          <p className="text-destructive text-sm">{form.formState.errors.username.message}</p>
        )}
        {usernameStatus === 'taken' && (
          <p className="text-destructive text-sm">This username is already taken</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          placeholder="How should we call you?"
          {...form.register('displayName')}
        />
        {form.formState.errors.displayName && (
          <p className="text-destructive text-sm">{form.formState.errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell us a bit about yourself..."
          className="resize-none"
          rows={3}
          {...form.register('bio')}
        />
        {form.formState.errors.bio && (
          <p className="text-destructive text-sm">{form.formState.errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Interests (pick up to 10)</Label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_SUGGESTIONS.map((interest) => {
            const isSelected = selectedInterests.includes(interest);
            return (
              <Badge
                key={interest}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected && 'bg-primary text-primary-foreground',
                )}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            );
          })}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending || usernameStatus === 'taken'}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <HavenLogo className="mr-2 h-4 w-4" />
        )}
        {isPending ? 'Setting up...' : 'Enter Haven'}
      </Button>
    </form>
  );
}
