import type { Metadata } from 'next';

import { ActivityList } from './activity-list';

export const metadata: Metadata = {
  title: 'Activity',
  description: 'Your recent activity on Haven.',
};

export default function ActivityPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Activity</h1>
        <p className="text-muted-foreground text-xs">Your recent actions on Haven</p>
      </div>

      <ActivityList />
    </div>
  );
}
