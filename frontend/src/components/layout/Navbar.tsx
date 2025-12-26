import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Compass, DoorOpen, Layers, Users, Sparkles, Bug } from 'lucide-react';

import cn from '@/lib/utils';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';

import useAuth from '../../hooks/useAuth';
import LanguageSelector from '../ui/LanguageSelector';
import Logo from '../ui/Logo';
import type { Room } from '../../types/models';
import { useI18n } from '../../i18n';

type NavbarAuthUser = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

type NavbarAuthHookResult = {
  user: NavbarAuthUser | null;
  signOut: () => Promise<void> | void;
};

type NavbarAuthHook = () => NavbarAuthHookResult;

const useDefaultNavbarAuth: NavbarAuthHook = () => {
  const { user, signOut } = useAuth();
  return { user, signOut };
};

interface NavbarProps {
  room?: Room | null;
  playerCount?: number;
  showRoomInfo?: boolean;
  useAuthHook?: NavbarAuthHook;
}

interface NavLink {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

const navLinks: NavLink[] = [
  {
    id: 'rooms',
    label: 'navbar.links.rooms',
    path: '/room',
    icon: DoorOpen,
  },
  {
    id: 'game',
    label: 'navbar.links.game',
    path: '/game',
    icon: Users,
  },
  {
    id: 'explore',
    label: 'navbar.links.explore',
    path: '/rules',
    icon: Compass,
  },
  {
    id: 'assets',
    label: 'navbar.links.assets',
    path: '/assets',
    icon: Layers,
  },
  {
    id: 'debug',
    label: 'Debug',
    path: '/debug',
    icon: Bug,
  },
];

/**
 * Navigation bar component - Premium "Sanctum" Edition
 */
export default function Navbar({
  room: _room = null,
  playerCount: _playerCount = 0,
  showRoomInfo = false,
  useAuthHook = useDefaultNavbarAuth,
}: NavbarProps) {
  const { user, signOut } = useAuthHook();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const avatarSrc = user?.photoURL && user.photoURL.trim().length > 0 ? user.photoURL : user ? '/face.png' : undefined;
  const { t } = useI18n();

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
  };

  // Helper to check active state
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="relative z-50 border-b border-midnight-500/40 bg-midnight-950/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      {/* Top golden accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aurora-500/30 to-transparent" />

      <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center gap-6 px-6 sm:px-8 lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Logo
            size="md"
            className="opacity-90 transition-opacity hover:opacity-100"
            onClick={() => {
              closeMenus();
              navigate('/');
            }}
          />

          {/* Divider */}
          <div className="hidden h-8 w-px bg-gradient-to-b from-transparent via-midnight-500 to-transparent sm:block" />

          {/* Desktop Links */}
          <div className="hidden flex-1 items-center gap-2 sm:flex" data-testid="navbar-desktop-links">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    navigate(link.path);
                    closeMenus();
                  }}
                  className={cn(
                    'group relative flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-300',
                    active ? 'text-aurora-200' : 'text-shadow-400 hover:text-shadow-100'
                  )}
                  data-testid={`navbar-desktop-link-${link.id}`}
                >
                  {/* Background Glow for Active State */}
                  {active && (
                    <div className="absolute inset-0 rounded-lg bg-aurora-500/10 shadow-[inner_0_0_10px_rgba(211,143,31,0.1)]" />
                  )}

                  <link.icon
                    className={cn(
                      'relative h-4 w-4 transition-transform duration-300 group-hover:scale-110',
                      active ? 'text-aurora-300 blur-[0.5px]' : 'text-shadow-500 group-hover:text-aurora-200'
                    )}
                    aria-hidden
                  />
                  {/* Active icon duplicate for clarity over blur */}
                  {active && <link.icon className="absolute h-4 w-4 text-aurora-100" aria-hidden />}

                  <span
                    className={cn(
                      'relative text-xs font-semibold uppercase tracking-[0.2em]',
                      active ? 'font-bold text-shadow-100' : ''
                    )}
                  >
                    {t(link.label)}
                  </span>

                  {/* Bottom Active Indicator Line */}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-aurora-400 to-transparent shadow-[0_0_8px_rgba(211,143,31,0.6)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right - Language & User Menu (Desktop) */}
        <div className="ml-auto hidden items-center gap-4 md:flex">
          <LanguageSelector variant="compact" data-testid="navbar-desktop-language-selector" />

          {user && (
            <Menubar className="border-none bg-transparent p-0 shadow-none">
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <button
                    type="button"
                    className="group flex items-center gap-3 rounded-full border border-midnight-500/60 bg-midnight-800/40 pl-2 pr-4 py-1.5 transition-all duration-300 hover:border-aurora-500/30 hover:bg-midnight-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-500/20"
                    data-testid="navbar-desktop-user-trigger"
                  >
                    {avatarSrc && (
                      <div className="relative">
                        <img
                          src={avatarSrc}
                          alt={user.displayName || user.email || 'User'}
                          className="h-8 w-8 rounded-full border border-midnight-400 object-cover shadow-md transition-all group-hover:border-aurora-400/50"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_6px_rgba(0,0,0,0.2)]" />
                      </div>
                    )}
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="max-w-[8rem] truncate text-xs font-semibold text-shadow-200 group-hover:text-shadow-100">
                        {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-aurora-500/80 group-hover:text-aurora-400">
                        Online
                      </span>
                    </div>
                  </button>
                </MenubarTrigger>
                <MenubarContent
                  align="end"
                  className="w-56 rounded-xl border border-midnight-500/60 bg-midnight-900/95 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                  data-testid="navbar-desktop-user-menu"
                >
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-shadow-500">
                    {t('navbar.labels.account')}
                  </div>

                  {showRoomInfo && (
                    <>
                      <MenubarItem
                        onSelect={handleLeaveRoom}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-shadow-200 focus:bg-midnight-800 focus:text-aurora-200"
                        data-testid="navbar-leave-room"
                      >
                        <DoorOpen className="h-4 w-4 opacity-70" />
                        {t('navbar.actions.leaveRoom')}
                      </MenubarItem>
                      <MenubarSeparator className="my-1 bg-midnight-700/50" />
                    </>
                  )}

                  <MenubarItem
                    onSelect={handleLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 focus:bg-red-950/30 focus:text-red-200"
                    data-testid="navbar-logout"
                  >
                    <Sparkles className="h-4 w-4 opacity-70" />
                    {t('navbar.actions.logout')}
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-lg border border-midnight-500/60 bg-midnight-800/40 p-2 text-shadow-300 transition-colors hover:border-aurora-500/30 hover:text-aurora-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-midnight-700/50 bg-midnight-900/95 backdrop-blur-xl md:hidden">
          <div className="space-y-2 p-4">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <button
                  key={`mobile-${link.id}`}
                  type="button"
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                    active
                      ? 'border-aurora-500/30 bg-aurora-500/10 text-aurora-100 shadow-[inset_0_0_20px_rgba(211,143,31,0.05)]'
                      : 'border-midnight-700/30 bg-midnight-800/30 text-shadow-300 hover:bg-midnight-800/50'
                  )}
                  data-testid={`navbar-mobile-link-${link.id}`}
                >
                  <link.icon className={cn('h-5 w-5', active ? 'text-aurora-300' : 'text-shadow-500')} />
                  {t(link.label)}
                </button>
              );
            })}

            {/* User Info Mobile */}
            {user && (
              <div className="mt-6 border-t border-midnight-700/50 pt-6">
                <div className="flex items-center gap-3 px-2 pb-4">
                  {avatarSrc && (
                    <img
                      src={avatarSrc}
                      alt={user.displayName || user.email || 'User'}
                      className="h-10 w-10 rounded-full border border-aurora-500/30 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-shadow-100">{user.displayName || user.email}</span>
                    <span className="text-xs text-shadow-400">Logged in via Google</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <LanguageSelector
                    variant="compact"
                    className="w-full justify-between"
                    data-testid="navbar-mobile-language-selector"
                  />

                  {showRoomInfo && (
                    <button
                      type="button"
                      onClick={() => {
                        handleLeaveRoom();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full rounded-xl border border-midnight-700/30 bg-midnight-800/30 px-4 py-3 text-left text-sm font-medium text-shadow-300 transition-colors hover:bg-midnight-800/50"
                      data-testid="navbar-mobile-leave-room"
                    >
                      {t('navbar.actions.leaveRoom')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-950/20"
                    data-testid="navbar-mobile-logout"
                  >
                    {t('navbar.actions.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
