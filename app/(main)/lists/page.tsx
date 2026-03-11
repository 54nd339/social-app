import { ListGrid } from '@/components/lists';

export default function ListsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Lists</h1>
        <p className="text-muted-foreground text-xs">Custom groups to filter your feed</p>
      </div>

      <ListGrid />
    </div>
  );
}
