'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  BarChart3,
  Globe,
  ImagePlus,
  Loader2,
  Minus,
  Plus,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CollabInvite } from '@/components/feed/collab-invite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPost } from '@/lib/actions/post.actions';
import {
  MAX_IMAGES_PER_POST,
  MAX_POLL_OPTIONS,
  MAX_POST_LENGTH,
  POST_VISIBILITY,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { PostVisibility } from '@/types';

interface CircleOption {
  id: string;
  name: string;
  emoji: string | null;
}

async function fetchCircles(): Promise<CircleOption[]> {
  const res = await fetch('/api/circles');
  if (!res.ok) return [];
  return res.json();
}

interface PostComposerProps {
  className?: string;
}

interface PollData {
  question: string;
  options: string[];
  expiresInHours?: number;
}

interface ImageData {
  url: string;
  file?: File;
  preview: string;
}

const VISIBILITY_CONFIG: Record<PostVisibility, { icon: typeof Globe; label: string }> = {
  public: { icon: Globe, label: 'Public' },
  followers: { icon: Users, label: 'Followers' },
  circle: { icon: Shield, label: 'Circle' },
};

export function PostComposer({ className }: PostComposerProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [circleId, setCircleId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [contentWarning, setContentWarning] = useState('');
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [collabUser, setCollabUser] = useState<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null>(null);

  const { data: circles } = useQuery({
    queryKey: ['circles'],
    queryFn: fetchCircles,
    enabled: visibility === 'circle',
  });

  const charCount = content.length;
  const isOverLimit = charCount > MAX_POST_LENGTH;
  const canPost = content.trim().length > 0 && !isOverLimit && !isPending;

  const { mutate: submitPost } = useMutation({
    mutationFn: (data: Parameters<typeof createPost>[0]) => createPost(data),
    onSuccess: () => {
      setContent('');
      setImages([]);
      setPoll(null);
      setContentWarning('');
      setShowContentWarning(false);
      setCollabUser(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  function handleSubmit() {
    if (!canPost) return;

    startTransition(() => {
      submitPost({
        content,
        visibility,
        circleId: visibility === 'circle' ? circleId : undefined,
        collabUserId: collabUser?.id ?? undefined,
        images: images.map((img) => ({ url: img.url })),
        poll: poll
          ? {
              question: poll.question,
              options: poll.options.filter(Boolean),
              expiresInHours: poll.expiresInHours,
            }
          : undefined,
        contentWarning: showContentWarning && contentWarning ? contentWarning : undefined,
      });
    });
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES_PER_POST - images.length;
    const newFiles = files.slice(0, remaining);

    const newImages: ImageData[] = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function togglePoll() {
    if (poll) {
      setPoll(null);
    } else {
      setPoll({ question: '', options: ['', ''] });
    }
  }

  function updatePollOption(index: number, value: string) {
    if (!poll) return;
    const newOptions = [...poll.options];
    newOptions[index] = value;
    setPoll({ ...poll, options: newOptions });
  }

  function addPollOption() {
    if (!poll || poll.options.length >= MAX_POLL_OPTIONS) return;
    setPoll({ ...poll, options: [...poll.options, ''] });
  }

  function removePollOption(index: number) {
    if (!poll || poll.options.length <= 2) return;
    setPoll({ ...poll, options: poll.options.filter((_, i) => i !== index) });
  }

  const VisibilityIcon = VISIBILITY_CONFIG[visibility].icon;

  return (
    <div className={cn('bg-card border-b p-4', className)}>
      <div className="flex gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user?.imageUrl} alt={user?.username ?? ''} />
          <AvatarFallback>{user?.username?.charAt(0).toUpperCase() ?? '?'}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="placeholder:text-muted-foreground/60 min-h-[80px] resize-none border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
          />

          {showContentWarning && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              <Input
                placeholder="Content warning (e.g., spoilers, sensitive topic)"
                value={contentWarning}
                onChange={(e) => setContentWarning(e.target.value)}
                className="h-8 text-sm"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setShowContentWarning(false);
                  setContentWarning('');
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img, idx) => (
                <div
                  key={img.preview}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  <Image
                    src={img.preview}
                    alt={`Upload ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeImage(idx)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {poll && (
            <div className="space-y-2 rounded-lg border p-3">
              <Input
                placeholder="Ask a question..."
                value={poll.question}
                onChange={(e) => setPoll({ ...poll, question: e.target.value })}
                className="h-8 text-sm font-medium"
              />
              {poll.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) => updatePollOption(idx, e.target.value)}
                    className="h-8 text-sm"
                  />
                  {poll.options.length > 2 && (
                    <Button variant="ghost" size="icon-xs" onClick={() => removePollOption(idx)}>
                      <Minus className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
              {poll.options.length < MAX_POLL_OPTIONS && (
                <Button variant="ghost" size="sm" className="w-full" onClick={addPollOption}>
                  <Plus className="size-4" />
                  Add option
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES_PER_POST}
              >
                <ImagePlus className="text-muted-foreground size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={togglePoll}
                className={cn(poll && 'text-primary')}
              >
                <BarChart3 className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowContentWarning(!showContentWarning)}
                className={cn(showContentWarning && 'text-amber-500')}
              >
                <AlertTriangle className="size-4" />
              </Button>

              <CollabInvite selectedUser={collabUser} onSelect={setCollabUser} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <VisibilityIcon className="size-3.5" />
                    {VISIBILITY_CONFIG[visibility].label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {POST_VISIBILITY.map((v) => {
                    const config = VISIBILITY_CONFIG[v];
                    const Icon = config.icon;
                    return (
                      <DropdownMenuItem key={v} onClick={() => setVisibility(v)}>
                        <Icon className="size-4" />
                        {config.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {visibility === 'circle' && (
                <Select value={circleId ?? ''} onValueChange={(v) => setCircleId(v || null)}>
                  <SelectTrigger className="h-7 w-auto gap-1 text-xs">
                    <SelectValue placeholder="Pick circle" />
                  </SelectTrigger>
                  <SelectContent>
                    {circles?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.emoji ?? '🔵'} {c.name}
                      </SelectItem>
                    ))}
                    {(!circles || circles.length === 0) && (
                      <SelectItem value="" disabled>
                        No circles yet
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-3">
              {charCount > 0 && (
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    isOverLimit
                      ? 'text-destructive'
                      : charCount > MAX_POST_LENGTH * 0.9
                        ? 'text-amber-500'
                        : 'text-muted-foreground',
                  )}
                >
                  {charCount}/{MAX_POST_LENGTH}
                </span>
              )}
              <Button size="sm" disabled={!canPost} onClick={handleSubmit}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
