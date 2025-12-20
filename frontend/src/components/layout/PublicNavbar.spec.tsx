import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PublicNavbar from './PublicNavbar';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };

const translations: Record<string, string> = {
  'navbar.links.rooms': 'Rooms',
  'navbar.links.game': 'Game',
  'navbar.links.explore': 'Explore',
  'navbar.links.assets': 'Assets',
  'auth.login': 'Log In',
};

const LanguageSelectorMock = vi.hoisted(() =>
  vi.fn(({ variant, className }: { variant?: string; className?: string }) => (
    <div data-testid="public-navbar-language" data-variant={variant ?? 'default'} data-class={className ?? ''} />
  ))
);

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../ui/LanguageSelector', () => ({
  __esModule: true,
  default: LanguageSelectorMock,
}));

describe('PublicNavbar', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    LanguageSelectorMock.mockReset();
    mockLocation.pathname = '/';
  });

  afterEach(() => {
    cleanup();
  });

  it('navigates immediately when clicking a desktop menubar trigger', () => {
    render(
      <MemoryRouter>
        <PublicNavbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('public-navbar-desktop-trigger-explore'));
    expect(mockNavigate).toHaveBeenCalledWith('/rules');
  });

  // ... (middle test unchanged)

  it('marks the active route with aria-current', () => {
    mockLocation.pathname = '/rules';
    render(
      <MemoryRouter>
        <PublicNavbar />
      </MemoryRouter>
    );

    expect(screen.getByTestId('public-navbar-desktop-trigger-explore')).toHaveAttribute('aria-current', 'page');
  });
});
