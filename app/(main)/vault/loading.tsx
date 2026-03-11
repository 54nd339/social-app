import { Skeleton } from '@/components/ui/skeleton';

export default function VaultLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-20 rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}
