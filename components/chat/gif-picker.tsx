'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface GifResult {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (url: string) => void;
  children: React.ReactNode;
}

export function GifPicker({ onSelect, children }: GifPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(true);
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      fetch(`/api/tenor${params}`)
        .then((r) => r.json())
        .then((data) => setResults(data.results ?? []))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(url: string) {
    setOpen(false);
    onSelect(url);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="h-64 overflow-y-auto p-1">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-xs">No GIFs found</p>
          )}

          {!isLoading && (
            <div className="columns-2 gap-1">
              {results.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif.url)}
                  className="mb-1 block w-full overflow-hidden rounded-md transition-opacity hover:opacity-80"
                >
                  <Image
                    src={gif.previewUrl}
                    alt={gif.title}
                    width={gif.width}
                    height={gif.height}
                    className="w-full"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-muted-foreground border-t px-2 py-1 text-center text-[9px]">
          Powered by Tenor
        </div>
      </PopoverContent>
    </Popover>
  );
}
