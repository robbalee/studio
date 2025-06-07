import type React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { AppContextProvider } from '@/contexts/AppContext';

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppContextProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </AppContextProvider>
  );
}
