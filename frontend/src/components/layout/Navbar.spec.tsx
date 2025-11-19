import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GamePhase, type Room } from '../../types/shared';
import Navbar from './Navbar';

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();
const mockSetLanguage = vi.fn();

const mockUser = {
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: 'https://example.com/avatar.png',
};

// Use vi.hoisted to ensure mock is available before module import
const LanguageSelectorMock = vi.hoisted(() =>
  vi.fn(({ variant }: { variant?: string }) => (
    <div data-testid="mock-language-selector" data-variant={variant ?? 'default'} />
  ))
);

const translations: Record<string, string> = {
  'navbar.brandAlt': 'DAIcer logo',
  'navbar.links.rooms': 'Rooms',
  'navbar.links.game': 'Game',
  'navbar.links.explore': 'Explore',
  'navbar.links.assets': 'Assets',
  'navbar.labels.account': 'Account',
  'navbar.actions.leaveRoom': 'Leave Room',
  'navbar.actions.logout': 'Logout',
  'navbar.phase.setup': 'Setup',
  'navbar.labels.room': 'Room',
  'navbar.labels.phase': 'Phase',
  'navbar.labels.players': 'Players',
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => translations[key] ?? key,
    language: 'en',
    setLanguage: mockSetLanguage,
    availableLanguages: [{ code: 'en', short: 'EN', name: 'English' }],
  }),
}));

vi.mock('../ui/LanguageSelector', () => ({
  __esModule: true,
  default: LanguageSelectorMock,
}));

const sampleRoom: Room = {
  id: 'room-1',
  code: 'ABCD',
  ownerId: 'owner',
  settings: null,
  worldDescription: '',
  phase: GamePhase.SETUP,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('Navbar', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
    mockSetLanguage.mockReset();
    LanguageSelectorMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  const openUserMenu = async () => {
    const trigger = screen.getByTestId('navbar-desktop-user-trigger');
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByTestId('navbar-desktop-user-menu')).toBeInTheDocument());
  };

  it('renders the compact language selector variant on desktop', async () => {
    render(
      <Navbar
        room={sampleRoom}
        showRoomInfo
        playerCount={3}
        useAuthHook={() => ({ user: mockUser, signOut: mockSignOut })}
      />
    );

    await openUserMenu();

    await waitFor(() => {
      expect(LanguageSelectorMock).toHaveBeenCalledTimes(1);
    });
    expect(LanguageSelectorMock.mock.calls[0][0]).toEqual(expect.objectContaining({ variant: 'compact' }));
  });

  it('only reveals logout after toggling the user dropdown', async () => {
    render(
      <Navbar
        room={sampleRoom}
        showRoomInfo
        playerCount={3}
        useAuthHook={() => ({ user: mockUser, signOut: mockSignOut })}
      />
    );

    expect(screen.queryByTestId('navbar-logout')).toBeNull();

    await openUserMenu();

    expect(screen.getByTestId('navbar-logout')).toBeInTheDocument();
  });

  it('navigates when selecting leave room from the dropdown', async () => {
    render(
      <Navbar
        room={sampleRoom}
        showRoomInfo
        playerCount={3}
        useAuthHook={() => ({ user: mockUser, signOut: mockSignOut })}
      />
    );

    await openUserMenu();
    fireEvent.click(screen.getByTestId('navbar-leave-room'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('signs out and redirects after selecting logout', async () => {
    render(
      <Navbar
        room={sampleRoom}
        showRoomInfo
        playerCount={3}
        useAuthHook={() => ({ user: mockUser, signOut: mockSignOut })}
      />
    );

    await openUserMenu();
    fireEvent.click(screen.getByTestId('navbar-logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
