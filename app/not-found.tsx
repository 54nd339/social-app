import { Flame } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl">
        <Flame className="text-primary h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-foreground text-4xl font-bold">404</h1>
        <p className="text-muted-foreground text-lg">
          This page doesn&apos;t exist. Maybe it never did.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
