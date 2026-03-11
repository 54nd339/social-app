import { Skeleton } from '@/components/ui/skeleton';

export default function WellbeingLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
    </div>
  );
}
