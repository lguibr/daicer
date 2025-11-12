import type { ReactNode } from 'react';

import cn from '@/lib/utils';

import AnimatedBackground from '../ui/AnimatedBackground';

type LayoutTone = 'public' | 'private';

interface BaseLayoutProps {
  children: ReactNode;
  tone?: LayoutTone;
  showBackground?: boolean;
  className?: string;
  contentClassName?: string;
}

const toneOverlay: Record<LayoutTone, string> = {
  private: 'bg-gradient-to-br from-midnight-900/85 via-midnight-900/70 to-transparent',
  public: 'bg-gradient-to-br from-midnight-800/80 via-midnight-700/60 to-transparent',
};

export default function BaseLayout({
  children,
  tone = 'private',
  showBackground = true,
  className,
  contentClassName,
}: BaseLayoutProps) {
  return (
    <div className={cn('relative min-h-dvh overflow-hidden bg-background', className)}>
      {showBackground && <AnimatedBackground />}
      <div className={cn('absolute inset-0 pointer-events-none', toneOverlay[tone])} aria-hidden />
      <div className={cn('relative z-10 flex min-h-dvh flex-col', contentClassName)}>{children}</div>
    </div>
  );
}
