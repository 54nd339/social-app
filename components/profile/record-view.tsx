'use client';

import { useEffect } from 'react';

import { recordProfileView } from '@/lib/actions/profile-power.actions';

interface RecordViewProps {
  viewedUserId: string;
}

export function RecordView({ viewedUserId }: RecordViewProps) {
  useEffect(() => {
    recordProfileView(viewedUserId).catch(() => {});
  }, [viewedUserId]);

  return null;
}
