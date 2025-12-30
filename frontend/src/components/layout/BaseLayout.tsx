import type { ReactNode } from 'react';

import cn from '@/lib/utils';

import AnimatedBackground from '../ui/AnimatedBackground';
import { ReloadPrompt } from '../pwa/ReloadPrompt';

type LayoutTone = 'public' | 'private';

interface BaseLayoutProps {
  children: ReactNode;
  tone?: LayoutTone;
  showBackground?: boolean;
  className?: string;
  contentClassName?: string;
}

const toneOverlay: Record<LayoutTone, string> = {
  private: 'bg-gradient-to-br from-midnight-950/70 via-midnight-950/50 to-midnight-950/30',
  public: 'bg-gradient-to-br from-midnight-950/80 via-midnight-900/60 to-transparent',
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
      <ReloadPrompt />
    </div>
  );
}
