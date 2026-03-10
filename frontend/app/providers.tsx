'use client';

import { DataProvider } from '@/lib/DataContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </DataProvider>
  );
}
