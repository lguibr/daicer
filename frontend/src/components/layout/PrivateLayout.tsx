import type { ReactNode } from 'react';

import cn from '@/lib/utils';

import LanguageSelector from '../ui/LanguageSelector';
import BaseLayout from './BaseLayout';
import Navbar from './Navbar';
import AppBreadcrumb from './AppBreadcrumb';
import RoomInfoBar from './RoomInfoBar';
import type { Room, Player } from '@daicer/engine';

interface PrivateLayoutProps {
  children: ReactNode;
  room?: Room | null;
  players?: Player[];
  playerCount?: number;
  showRoomInfo?: boolean;
  showNavbar?: boolean;
  className?: string;
  mainClassName?: string;
}

export default function PrivateLayout({
  children,
  room = null,
  players = [],
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
      {showNavbar && (
        <>
          <Navbar room={room} playerCount={playerCount} showRoomInfo={showRoomInfo} />
          <AppBreadcrumb />
        </>
      )}
      {showRoomInfo && room && players && <RoomInfoBar room={room} players={players} />}
      <main className={cn('flex-1', mainClassName)}>{children}</main>
    </BaseLayout>
  );
}
