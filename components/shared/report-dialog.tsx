'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitReport } from '@/lib/actions/report.actions';
import { cn } from '@/lib/utils';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
] as const;

type ReasonType = (typeof REASONS)[number]['value'];

interface ReportDialogProps {
  entityId: string;
  entityType: 'post' | 'comment' | 'message' | 'user';
  children?: React.ReactNode;
}

export function ReportDialog({ entityId, entityType, children }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReasonType | null>(null);
  const [description, setDescription] = useState('');

  const { mutate: report, isPending } = useMutation({
    mutationFn: () =>
      submitReport({
        entityId,
        entityType,
        reason: reason!,
        description: description || undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      setReason(null);
      setDescription('');
      toast.success('Report submitted. We will review it shortly.');
    },
    onError: () => toast.error('Failed to submit report'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm" className="text-destructive gap-2">
            <Flag className="size-3.5" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Report {entityType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm transition-colors',
                    reason === r.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-accent',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Details (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context..."
              rows={3}
            />
          </div>

          <Button
            onClick={() => report()}
            disabled={!reason || isPending}
            className="w-full"
            variant="destructive"
          >
            Submit report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
