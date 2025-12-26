/**
 * Unified dynamic layout - adapts navbar based on authentication state
 * Shows appropriate navbar for ALL pages
 */

import type { ReactNode } from 'react';
import cn from '@/lib/utils';
import BaseLayout from './BaseLayout';
import Navbar from './Navbar';
import PublicNavbar from './PublicNavbar';
import AppBreadcrumb from './AppBreadcrumb';
import RoomInfoBar from './RoomInfoBar';
import LanguageSelector from '../ui/LanguageSelector';
import useAuth from '../../hooks/useAuth';
import type { Room, Player } from '@daicer/engine';

interface DynamicLayoutProps {
  children: ReactNode;
  room?: Room | null;
  players?: Player[];
  playerCount?: number;
  showRoomInfo?: boolean;
  showNavbar?: boolean;
  showLanguageSelector?: boolean;
  className?: string;
  mainClassName?: string;
}

/**
 * Dynamic layout component
 * - Shows PublicNavbar if not authenticated
 * - Shows Navbar (authenticated) if authenticated
 * - Always shows navbar unless explicitly disabled
 */
export default function DynamicLayout({
  children,
  room = null,
  players = [],
  playerCount = 0,
  showRoomInfo = false,
  showNavbar = true,
  showLanguageSelector = false,
  className,
  mainClassName,
}: DynamicLayoutProps) {
  const { user } = useAuth();

  return (
    <BaseLayout tone={user ? 'private' : 'public'} contentClassName={cn('relative flex min-h-dvh flex-col', className)}>
      {/* Language selector for pages with navbar disabled */}
      {!showNavbar && showLanguageSelector && (
        <div className="absolute right-6 top-6 z-20">
          <LanguageSelector />
        </div>
      )}

      {/* Navbar - Public or Private based on auth */}
      {showNavbar &&
        (user ? (
          <>
            <Navbar room={room} playerCount={playerCount} showRoomInfo={showRoomInfo} />
            <AppBreadcrumb />
          </>
        ) : (
          <PublicNavbar />
        ))}

      {/* Room info bar (only for authenticated users with room data) */}
      {showRoomInfo && room && players && user && <RoomInfoBar room={room} players={players} />}

      {/* Main content */}
      <main className={cn('flex-1', mainClassName)}>{children}</main>
    </BaseLayout>
  );
}
