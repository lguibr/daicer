import type { ReactNode } from 'react';

import cn from '@/lib/utils';

import BaseLayout from './BaseLayout';
import PublicNavbar from './PublicNavbar';

interface PublicLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  className?: string;
  mainClassName?: string;
}

export default function PublicLayout({ children, showNavbar = true, className, mainClassName }: PublicLayoutProps) {
  return (
    <BaseLayout tone="public" contentClassName={cn('relative flex min-h-dvh flex-col', className)}>
      {showNavbar && <PublicNavbar />}
      <main className={cn('flex-1', mainClassName)}>{children}</main>
    </BaseLayout>
  );
}
