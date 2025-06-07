
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const getBreadcrumbName = (segment: string): string => {
  if (segment === 'dashboard') return 'Dashboard';
  if (segment === 'claims') return 'Claims';
  if (segment === 'new') return 'New Claim';
  if (segment === 'notifications') return 'Notifications';
  if (segment === 'admin') return 'AI Reports';
  if (segment.startsWith('clm_')) return 'Claim Details'; // For dynamic claim IDs
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
};


export function Header() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <nav className="hidden md:flex items-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          return (
            <span key={segment} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
              {isLast ? (
                <span className="font-medium text-foreground">{getBreadcrumbName(segment)}</span>
              ) : (
                <Link href={href} className="hover:text-foreground">
                  {getBreadcrumbName(segment)}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
      {/* Add User Profile/Actions here later if needed */}
    </header>
  );
}
