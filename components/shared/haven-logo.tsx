import { cn } from '@/lib/utils';

interface HavenLogoProps {
  className?: string;
}

export function HavenLogo({ className }: HavenLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-6', className)}
      aria-hidden="true"
    >
      <path d="M12 2L3 7v6c0 5.25 3.75 9.25 9 11 5.25-1.75 9-5.75 9-11V7l-9-5Z" />
      <path d="M10 9.5v5M14 9.5v5M10 12h4" strokeWidth="2" />
    </svg>
  );
}
