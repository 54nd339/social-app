import { CommandPalette } from '@/components/shared/command-palette';
import { MobileNav } from '@/components/shared/mobile-nav';
import { Navbar } from '@/components/shared/navbar';
import { Sidebar } from '@/components/shared/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <MobileNav />
      </div>

      <CommandPalette />
    </div>
  );
}
