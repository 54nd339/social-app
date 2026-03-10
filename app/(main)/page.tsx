import { Flame } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Flame className="text-primary h-8 w-8" />
        </div>
        <h1 className="text-foreground text-3xl font-bold">Welcome to Haven</h1>
        <p className="text-muted-foreground max-w-md">
          Your digital sanctuary. A private, ad-free space where genuine connection replaces
          engagement farming.
        </p>
      </div>
    </div>
  );
}
