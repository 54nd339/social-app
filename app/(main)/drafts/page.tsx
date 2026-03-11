import type { Metadata } from 'next';

import { DraftList } from './draft-list';

export const metadata: Metadata = {
  title: 'Drafts & Scheduled',
  description: 'Manage your draft and scheduled posts.',
};

export default function DraftsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Drafts & Scheduled</h1>
        <p className="text-muted-foreground text-xs">Unfinished and upcoming posts</p>
      </div>

      <DraftList />
    </div>
  );
}
