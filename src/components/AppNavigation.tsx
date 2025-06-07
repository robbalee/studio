
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FilePlus2, List, Bell, Brain } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/claims/new', label: 'New Claim', icon: FilePlus2 },
  { href: '/claims', label: 'All Claims', icon: List },
  { href: '/notifications', label: 'Notifications', icon: Bell, notificationKey: 'unreadNotifications' },
  { href: '/admin', label: 'AI Reports', icon: Brain },
];

export function AppNavigation() {
  const pathname = usePathname();
  const { notifications, claims } = useAppContext();

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const pendingClaimsCount = claims.filter(c => c.status === 'Pending' || c.status === 'Under Review').length;

  return (
    <SidebarMenu>
      {navItems.map(item => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        
        let itemSpecificBadgeCount = 0;
        if(item.href === '/claims' && (pendingClaimsCount > 0)) {
          itemSpecificBadgeCount = pendingClaimsCount;
        } else if (item.href === '/notifications' && (unreadNotificationsCount > 0)) {
          itemSpecificBadgeCount = unreadNotificationsCount;
        }

        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
              <SidebarMenuButton
                variant="ghost"
                className="w-full justify-start"
                isActive={isActive}
                tooltip={{ children: item.label, side: 'right', className: 'bg-card text-card-foreground border-border' }}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                {itemSpecificBadgeCount > 0 && (
                  <Badge variant="destructive" className="ml-auto group-data-[collapsible=icon]:hidden">
                    {itemSpecificBadgeCount}
                  </Badge>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
