"use client";

import type React from 'react';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { Logo } from '@/components/Logo';
import { AppNavigation } from '@/components/AppNavigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <Sidebar className="border-r">
        <SidebarHeader className="p-4 border-b">
          <Link href="/" aria-label="Go to homepage">
            <Logo />
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <AppNavigation />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
           <Button variant="ghost" className="w-full justify-start">
             <LogOut className="mr-2 h-5 w-5" />
             <span className="group-data-[collapsible=icon]:hidden">Logout</span>
           </Button>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col flex-1 min-h-screen"> {/* This div ensures Header and SidebarInset are stacked vertically and take full height */}
        <Header />
        <SidebarInset className="flex-1 overflow-y-auto"> {/* Ensure SidebarInset can scroll if content overflows */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
