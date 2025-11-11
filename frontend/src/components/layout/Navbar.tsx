import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import type { Room } from '../../types/shared';

interface NavbarProps {
  room?: Room | null;
  playerCount?: number;
  showRoomInfo?: boolean;
}

/**
 * Navigation bar component
 * @param props - Navbar props
 * @returns Navbar UI
 */
export default function Navbar({ room = null, playerCount = 0, showRoomInfo = false }: NavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLeaveRoom = () => {
    navigate('/lobby');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getPhaseLabel = (phase?: string) => {
    if (!phase) return '';
    switch (phase) {
      case 'SETUP':
        return 'Setup';
      case 'CHARACTER_CREATION':
        return 'Character Creation';
      case 'GAMEPLAY':
        return 'In Game';
      default:
        return phase;
    }
  };

  return (
    <nav className="relative z-50 bg-midnight-400/80 border-b border-midnight-500/70 shadow-[0_18px_40px_rgba(4,7,12,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigate('/lobby')}
          className="group flex items-center gap-4 focus:outline-none"
        >
          <img
            src="/logo.png"
            alt="dAIcer logo"
            className="h-12 w-12 rounded-full shadow-[0_10px_25px_rgba(4,7,12,0.45)] transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {/* Center - Room Info (Desktop) */}
        {showRoomInfo && room && (
          <div className="hidden md:flex items-center gap-6">
            {/* Room Code */}
            <div className="flex items-center gap-2">
              <span className="text-shadow-300 text-sm">Room:</span>
              <span className="font-mono text-lg font-bold text-aurora-200 bg-midnight-500/50 px-3 py-1 rounded border border-aurora-400/40">
                {room.code}
              </span>
            </div>

            {/* Phase Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-shadow-300 text-sm">Phase:</span>
              <span className="text-aurora-200 font-semibold">{getPhaseLabel(room.phase)}</span>
            </div>

            {/* Player Count */}
            {playerCount !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-shadow-300 text-sm">Players:</span>
                <span className="text-nebula-300 font-semibold">{playerCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Right - User Menu (Desktop) */}
        <div className="hidden items-center gap-4 md:flex">
          {user && (
            <>
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-9 w-9 rounded-full border border-aurora-500/40 shadow-xl"
                  />
                )}
                <span className="font-medium text-shadow-100">{user.displayName || user.email}</span>
              </div>

              {showRoomInfo && (
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="rounded-lg border border-midnight-400 bg-midnight-500/70 px-4 py-2 text-sm font-medium text-shadow-100 transition-colors hover:border-aurora-400/40 hover:bg-midnight-400/70"
                >
                  Leave Room
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-aurora-500/40 bg-aurora-500 px-4 py-2 text-sm font-semibold text-midnight-100 shadow-[0_12px_20px_rgba(211,143,31,0.25)] transition-all hover:-translate-y-0.5 hover:bg-aurora-400"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-midnight-500/60 bg-midnight-500/40 p-2 text-shadow-200 transition-colors hover:border-aurora-400/40 hover:text-shadow-50"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-aurora-500/20 bg-midnight-400/80 backdrop-blur-md">
          <div className="px-4 py-4 space-y-4">
            {/* Room Info Mobile */}
            {showRoomInfo && room && (
              <div className="space-y-3 pb-4 border-b border-midnight-600">
                <div className="flex items-center justify-between">
                  <span className="text-shadow-300 text-sm">Room Code:</span>
                  <span className="font-mono text-lg font-bold text-aurora-200 bg-midnight-500/50 px-3 py-1 rounded border border-aurora-400/40">
                    {room.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-shadow-300 text-sm">Phase:</span>
                  <span className="text-aurora-200 font-semibold">{getPhaseLabel(room.phase)}</span>
                </div>
                {playerCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-shadow-300 text-sm">Players:</span>
                    <span className="text-nebula-300 font-semibold">{playerCount}</span>
                  </div>
                )}
              </div>
            )}

            {/* User Info Mobile */}
            {user && (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-midnight-600">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full border-2 border-aurora-400/60"
                    />
                  )}
                  <span className="text-shadow-100 font-medium">{user.displayName || user.email}</span>
                </div>

                {showRoomInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      handleLeaveRoom();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-midnight-500 text-shadow-100 rounded-lg hover:bg-midnight-400 transition-colors font-medium"
                  >
                    Leave Room
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-aurora-500 text-midnight-100 rounded-lg hover:bg-aurora-400 transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
