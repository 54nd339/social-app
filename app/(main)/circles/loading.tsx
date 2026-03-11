import { Skeleton } from '@/components/ui/skeleton';

export default function CirclesLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
