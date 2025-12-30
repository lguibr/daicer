import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Compass, Home, LogIn } from 'lucide-react';

import cn from '@/lib/utils';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';

import LanguageSelector from '../ui/LanguageSelector';
import Logo from '../ui/Logo';
import { useI18n } from '../../i18n';

/**
 * Public navigation bar component for unauthenticated users
 * @returns PublicNavbar UI
 */
export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  interface NavLink {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    className: string;
    iconClassName: string;
    mobileClassName: string;
  }

  const navLinks = useMemo(
    (): NavLink[] => [
      {
        id: 'home',
        label: 'Home',
        path: '/',
        icon: Home,
        className:
          'border-shadow-500/40 bg-shadow-500/15 text-shadow-100 hover:bg-shadow-500/25 focus-visible:ring-shadow-300/40',
        iconClassName: 'text-shadow-100',
        mobileClassName: 'border-shadow-500/30 bg-shadow-500/15 text-shadow-100 hover:bg-shadow-500/25',
      },
      {
        id: 'explore',
        label: t('navbar.links.explore'),
        path: '/rules',
        icon: Compass,
        className:
          'border-aurora-400/40 bg-aurora-500/10 text-aurora-100 hover:bg-aurora-400/15 focus-visible:ring-aurora-400/40',
        iconClassName: 'text-aurora-200',
        mobileClassName: 'border-aurora-400/30 bg-aurora-500/10 text-aurora-100 hover:bg-aurora-500/20',
      },
    ],
    [t]
  );

  const closeMenus = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    closeMenus();
  };

  const isActive = (path: string) => location.pathname === path;

  const brandButton = <Logo size="md" onClick={() => handleNavigate('/')} />;

  return (
    <nav className="relative z-50 border-b border-midnight-500/70 bg-midnight-400/80 shadow-[0_18px_40px_rgba(4,7,12,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {brandButton}
          <Menubar
            className="hidden flex-1 items-center gap-1 border-none bg-transparent p-0 shadow-none sm:flex"
            data-testid="public-navbar-desktop-menubar"
          >
            {navLinks.map((link) => (
              <MenubarMenu key={link.id}>
                <MenubarTrigger
                  className={cn(
                    'border px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] transition-colors duration-200 focus-visible:ring-offset-0',
                    link.className,
                    isActive(link.path) && 'ring-2 ring-offset-2 ring-offset-midnight-900'
                  )}
                  aria-label={link.label}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  onClick={() => handleNavigate(link.path)}
                  data-testid={`public-navbar-desktop-trigger-${link.id}`}
                >
                  <link.icon className={cn('h-4 w-4', link.iconClassName)} aria-hidden />
                  <span className="hidden xl:inline">{link.label}</span>
                  <span className="sr-only xl:hidden">{link.label}</span>
                </MenubarTrigger>
                <MenubarContent
                  align="start"
                  className="min-w-[12rem]"
                  data-testid={`public-navbar-desktop-content-${link.id}`}
                >
                  <MenubarItem
                    onSelect={() => handleNavigate(link.path)}
                    className="flex items-center gap-2 text-shadow-50"
                    data-testid={`public-navbar-desktop-item-${link.id}`}
                  >
                    <link.icon className="h-4 w-4 text-aurora-200" aria-hidden />
                    <span>{link.label}</span>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            ))}
          </Menubar>
        </div>

        {/* Right - Controls (Desktop) */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <LanguageSelector variant="compact" data-testid="public-navbar-language-selector" />
          {!isActive('/') && (
            <button
              type="button"
              onClick={() => handleNavigate('/')}
              className="inline-flex items-center gap-2 rounded-lg border border-aurora-400/40 bg-aurora-500/10 px-4 py-2 text-sm font-semibold text-aurora-100 transition-colors hover:bg-aurora-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-400/40"
              data-testid="public-navbar-login-button"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              <span>{t('auth.login')}</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden ml-auto">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-midnight-500/60 bg-midnight-500/40 p-2 text-shadow-200 transition-colors hover:border-aurora-400/40 hover:text-shadow-50"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
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
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <button
                key={`mobile-${link.id}`}
                type="button"
                onClick={() => handleNavigate(link.path)}
                aria-current={isActive(link.path) ? 'page' : undefined}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                  link.mobileClassName,
                  isActive(link.path) && 'ring-2 ring-offset-2 ring-offset-midnight-900'
                )}
                data-testid={`public-navbar-mobile-link-${link.id}`}
              >
                {link.label}
              </button>
            ))}

            <div className="pt-3 border-t border-midnight-600">
              <LanguageSelector
                variant="compact"
                className="w-full mb-3"
                data-testid="public-navbar-mobile-language-selector"
              />
              {!isActive('/') && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/')}
                  className="w-full px-4 py-3 bg-aurora-500 text-midnight-100 rounded-lg hover:bg-aurora-400 transition-colors font-medium flex items-center justify-center gap-2"
                  data-testid="public-navbar-mobile-login-button"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{t('auth.login')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
