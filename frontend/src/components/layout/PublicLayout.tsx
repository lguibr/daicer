import type { ReactNode } from 'react';

import cn from '@/lib/utils';

import LanguageSelector from '../ui/LanguageSelector';
import BaseLayout from './BaseLayout';

interface PublicLayoutProps {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
}

export default function PublicLayout({ children, className, mainClassName }: PublicLayoutProps) {
  return (
    <BaseLayout tone="public" contentClassName={cn('relative flex min-h-dvh flex-col', className)}>
      <div className="absolute right-6 top-6 z-20">
        <LanguageSelector />
      </div>
      <main className={cn('flex-1', mainClassName)}>{children}</main>
    </BaseLayout>
  );
}
