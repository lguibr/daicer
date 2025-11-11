import type { ReactNode } from 'react';

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
    <BaseLayout tone="private" contentClassName={className}>
      {showNavbar && <Navbar room={room} playerCount={playerCount} showRoomInfo={showRoomInfo} />}
      <main className={mainClassName ?? 'flex-1'}>{children}</main>
    </BaseLayout>
  );
}
