import type { ReactNode } from 'react';

import cn from '@/lib/utils';

import LanguageSelector from '../ui/LanguageSelector';
import BaseLayout from './BaseLayout';
import Navbar from './Navbar';
import type { Room } from '../../types/shared';

interface PrivateLayoutProps {
  children: ReactNode;
  room?: Room | null;
  playerCount?: number;
  showRoomInfo?: boolean;
  showNavbar?: boolean;
  className?: string;
  mainClassName?: string;
}

export default function PrivateLayout({
  children,
  room = null,
  playerCount = 0,
  showRoomInfo = false,
  showNavbar = true,
  className,
  mainClassName,
}: PrivateLayoutProps) {
  return (
    <BaseLayout tone="private" contentClassName={cn('relative flex min-h-dvh flex-col', className)}>
      {!showNavbar && (
        <div className="absolute right-6 top-6 z-20">
          <LanguageSelector />
        </div>
      )}
      {showNavbar && <Navbar room={room} playerCount={playerCount} showRoomInfo={showRoomInfo} />}
      <main className={cn('flex-1', mainClassName)}>{children}</main>
    </BaseLayout>
  );
}
