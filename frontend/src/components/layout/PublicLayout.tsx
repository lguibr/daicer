import type { ReactNode } from 'react';

import BaseLayout from './BaseLayout';

interface PublicLayoutProps {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
}

export default function PublicLayout({ children, className, mainClassName }: PublicLayoutProps) {
  return (
    <BaseLayout tone="public" contentClassName={className}>
      <main className={mainClassName ?? 'flex-1'}>{children}</main>
    </BaseLayout>
  );
}
