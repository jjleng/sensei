'use client';

import context from '@/context';
import { cn } from '@/lib/utils';
import { useContext } from 'react';

export function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isSidebarOpen } = useContext(context);
  return (
    <>
      <div
        className={cn(
          'ml-0 pt-[var(--navbar-height)] sm:pt-0',
          isSidebarOpen
            ? 'sm:ml-[var(--sidebar-width-expanded)]'
            : 'sm:ml-[var(--sidebar-width-collapsed)]'
        )}
      >
        {children}
      </div>
    </>
  );
}
