'use client';

import { ThemeProvider } from 'next-themes';
import { DataProvider } from '@/lib/DataContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <DataProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
