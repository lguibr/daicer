import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Compass, DoorOpen, Layers, Users } from 'lucide-react';

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
import type { Room } from '../../types/shared';
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
  className: string;
  iconClassName: string;
}

const navLinks: NavLink[] = [
  {
    id: 'rooms',
    label: 'navbar.links.rooms',
    path: '/room',
    icon: DoorOpen,
    className:
      'border-shadow-500/40 bg-shadow-500/15 text-shadow-100 hover:bg-shadow-500/25 focus-visible:ring-shadow-300/40',
    iconClassName: 'text-shadow-100',
  },
  {
    id: 'game',
    label: 'navbar.links.game',
    path: '/game',
    icon: Users,
    className:
      'border-aurora-400/40 bg-aurora-500/10 text-aurora-100 hover:bg-aurora-400/15 focus-visible:ring-aurora-400/40',
    iconClassName: 'text-aurora-200',
  },
  {
    id: 'explore',
    label: 'navbar.links.explore',
    path: '/explore',
    icon: Compass,
    className:
      'border-aurora-400/40 bg-aurora-500/10 text-aurora-100 hover:bg-aurora-400/15 focus-visible:ring-aurora-400/40',
    iconClassName: 'text-aurora-200',
  },
  {
    id: 'assets',
    label: 'navbar.links.assets',
    path: '/assets',
    icon: Layers,
    className:
      'border-nebula-400/40 bg-nebula-500/10 text-nebula-100 hover:bg-nebula-400/15 focus-visible:ring-nebula-400/40',
    iconClassName: 'text-nebula-200',
  },
];

/**
 * Navigation bar component
 * @param props - Navbar props
 * @returns Navbar UI
 */
export default function Navbar({
  room: _room = null,
  playerCount: _playerCount = 0,
  showRoomInfo = false,
  useAuthHook = useDefaultNavbarAuth,
}: NavbarProps) {
  const { user, signOut } = useAuthHook();
  const navigate = useNavigate();
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

  return (
    <nav className="relative z-50 border-b border-midnight-500/70 bg-midnight-400/80 shadow-[0_18px_40px_rgba(4,7,12,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Logo
            size="md"
            onClick={() => {
              closeMenus();
              navigate('/');
            }}
          />
          <div className="hidden flex-1 items-center gap-2 sm:flex" data-testid="navbar-desktop-links">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  navigate(link.path);
                  closeMenus();
                }}
                className={cn(
                  'flex items-center gap-2 border px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] transition-colors duration-200 focus-visible:ring-offset-0',
                  link.className
                )}
                data-testid={`navbar-desktop-link-${link.id}`}
              >
                <link.icon className={cn('h-4 w-4', link.iconClassName)} aria-hidden />
                <span className="hidden xl:inline">{t(link.label)}</span>
                <span className="sr-only xl:hidden">{t(link.label)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right - Language & User Menu (Desktop) */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <LanguageSelector variant="compact" data-testid="navbar-desktop-language-selector" />
          {user && (
            <Menubar className="border-none bg-transparent p-0 shadow-none">
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-lg border border-midnight-400 bg-midnight-500/70 px-3 py-2 text-sm font-medium text-shadow-100 transition-colors hover:border-aurora-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300/40"
                    data-testid="navbar-desktop-user-trigger"
                  >
                    {avatarSrc && (
                      <img
                        src={avatarSrc}
                        alt={user.displayName || user.email || 'User'}
                        className="h-8 w-8 rounded-full border border-aurora-500/40 object-cover shadow-lg"
                        loading="lazy"
                      />
                    )}
                    <span className="max-w-[10rem] truncate text-left">{user.displayName || user.email}</span>
                  </button>
                </MenubarTrigger>
                <MenubarContent align="end" className="w-60" data-testid="navbar-desktop-user-menu">
                  <div className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-shadow-400">
                    {t('navbar.labels.account')}
                  </div>
                  <div className="flex flex-col gap-1 px-2 pb-2">
                    {showRoomInfo && (
                      <>
                        <MenubarItem
                          onSelect={() => {
                            handleLeaveRoom();
                          }}
                          className="flex items-center justify-between text-sm text-shadow-50"
                          data-testid="navbar-leave-room"
                        >
                          {t('navbar.actions.leaveRoom')}
                        </MenubarItem>
                        <MenubarSeparator />
                      </>
                    )}
                    <MenubarItem
                      onSelect={handleLogout}
                      className="flex items-center justify-between text-sm text-aurora-200"
                      data-testid="navbar-logout"
                    >
                      {t('navbar.actions.logout')}
                    </MenubarItem>
                  </div>
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
            {navLinks.map((link) => (
              <button
                key={`mobile-${link.id}`}
                type="button"
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-lg border border-shadow-500/30 bg-shadow-500/15 px-4 py-3 text-sm font-medium text-shadow-100 transition-colors hover:bg-shadow-500/25"
                data-testid={`navbar-mobile-link-${link.id}`}
              >
                {t(link.label)}
              </button>
            ))}

            {/* User Info Mobile */}
            {user && (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-midnight-600">
                  {avatarSrc && (
                    <img
                      src={avatarSrc}
                      alt={user.displayName || user.email || 'User'}
                      className="w-10 h-10 rounded-full border-2 border-aurora-400/60 object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className="text-shadow-100 font-medium">{user.displayName || user.email}</span>
                </div>

                <div className="pb-2">
                  <LanguageSelector
                    variant="compact"
                    className="w-full"
                    data-testid="navbar-mobile-language-selector"
                  />
                </div>

                {showRoomInfo && (
                  <button
                    type="button"
                    onClick={() => {
                      handleLeaveRoom();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-midnight-500 text-shadow-100 rounded-lg hover:bg-midnight-400 transition-colors font-medium"
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
                  className="w-full px-4 py-3 bg-aurora-500 text-midnight-100 rounded-lg hover:bg-aurora-400 transition-colors font-medium"
                  data-testid="navbar-mobile-logout"
                >
                  {t('navbar.actions.logout')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
