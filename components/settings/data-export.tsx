'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function DataExport() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `haven-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Your Data</h2>
        <p className="text-muted-foreground text-xs">
          Download a copy of your posts, comments, messages, and more.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        {isExporting ? 'Exporting...' : 'Export my data'}
      </Button>
    </div>
  );
}
