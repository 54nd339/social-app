'use client';

import { useZenModeStore } from '@/stores/zen-mode.store';

interface ZenMetricProps {
  value: number;
  fallback?: string;
}

export function ZenMetric({ value, fallback = '·' }: ZenMetricProps) {
  const zen = useZenModeStore((s) => s.enabled);

  if (zen) return <span className="text-muted-foreground">{fallback}</span>;
  if (value === 0) return null;
  return <span className="tabular-nums">{value}</span>;
}
