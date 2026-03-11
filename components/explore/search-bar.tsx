'use client';

import { useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(searchParams.get('q') ?? '');

  function handleSearch(term: string) {
    setValue(term);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term.trim()) {
        params.set('q', term.trim());
      } else {
        params.delete('q');
      }
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function handleClear() {
    setValue('');
    handleSearch('');
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <Search
        className={cn(
          'text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2',
          isPending && 'animate-pulse',
        )}
      />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search people, posts..."
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        className="pr-9 pl-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
