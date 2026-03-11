import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <Skeleton className="mb-4 h-8 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md p-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
