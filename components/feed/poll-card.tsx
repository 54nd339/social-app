'use client';

import { BarChart3 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { votePoll } from '@/lib/actions/post.actions';
import { cn } from '@/lib/utils';

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

interface PollCardProps {
  question: string;
  options: PollOption[];
  expiresAt: Date | null;
  userVotedOptionId: string | null;
}

export function PollCard({ question, options, expiresAt, userVotedOptionId }: PollCardProps) {
  const queryClient = useQueryClient();
  const hasVoted = userVotedOptionId !== null;
  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  const { mutate: vote, isPending } = useMutation({
    mutationFn: (optionId: string) => votePoll(optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-muted-foreground size-4" />
        <span className="text-sm font-medium">{question}</span>
      </div>

      <div className="space-y-1.5">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isSelected = option.id === userVotedOptionId;

          if (hasVoted || isExpired) {
            return (
              <div key={option.id} className="relative overflow-hidden rounded-md border p-2">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 transition-all',
                    isSelected ? 'bg-primary/20' : 'bg-muted',
                  )}
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between text-sm">
                  <span className={cn(isSelected && 'font-medium')}>{option.text}</span>
                  <span className="text-muted-foreground tabular-nums">{percentage}%</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              className="hover:bg-accent w-full rounded-md border p-2 text-left text-sm transition-colors disabled:opacity-50"
              onClick={() => vote(option.id)}
              disabled={isPending}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      <p className="text-muted-foreground text-xs">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        {isExpired && ' · Poll ended'}
        {!isExpired && expiresAt && ` · Ends ${new Date(expiresAt).toLocaleDateString()}`}
      </p>
    </div>
  );
}
