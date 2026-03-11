import type { Metadata } from 'next';

import { CircleGrid } from '@/components/circles';

export const metadata: Metadata = {
  title: 'Circles',
  description: 'Manage your private sharing circles.',
};

export default function CirclesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Circles</h1>
        <p className="text-muted-foreground text-xs">
          Share content with specific groups of people
        </p>
      </div>
      <CircleGrid />
    </div>
  );
}
