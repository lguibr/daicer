/**
 * Main layout component with navbar and animated background
 */

import React from 'react';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { Navbar } from './Navbar';
import type { Room } from '../../types/shared';

interface LayoutProps {
  children: React.ReactNode;
  room?: Room;
  playerCount?: number;
  showRoomInfo?: boolean;
  showNavbar?: boolean;
}

/**
 * Layout wrapper component
 * @param props - Layout props
 * @returns Layout UI with children
 */
export function Layout({ 
  children, 
  room, 
  playerCount, 
  showRoomInfo = false,
  showNavbar = true 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-midnight-200 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        {showNavbar && (
          <Navbar 
            room={room} 
            playerCount={playerCount} 
            showRoomInfo={showRoomInfo} 
          />
        )}

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

