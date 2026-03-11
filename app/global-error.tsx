'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="size-12 text-red-500" />
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="max-w-md text-zinc-400">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
