import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';

import AppProviders from '../../providers/AppProviders';
import NotFoundPage from '../NotFound';
import ErrorPage from '../Error';

vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
    Toaster: () => null,
  };
});

vi.mock('../../components/ui/dice-loader/DiceLoader', () => ({
  DiceLoader: ({ message }: { message?: string }) => <div data-testid="dice-loader">{message}</div>,
}));

vi.mock('../../components/ui/dice-roll-animation/DiceRollAnimation', () => ({
  DiceRollAnimation: ({ dice }: { dice: Array<{ result: number }> }) => (
    <div data-testid="dice-roll-animation">{dice.map((die) => die.result).join(',')}</div>
  ),
}));

function renderWithProviders(node: ReactElement) {
  return render(
    <MemoryRouter>
      <AppProviders>{node}</AppProviders>
    </MemoryRouter>
  );
}

describe('Status pages', () => {
  let clipboardSpy: { writeText: ReturnType<typeof vi.fn> } | null = null;

  beforeEach(() => {
    clipboardSpy = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardSpy,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (clipboardSpy) {
      clipboardSpy.writeText.mockReset();
    }
  });

  it.skip('renders localized copy for the 404 page', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('This route fell off the map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy broken link/i })).toBeInTheDocument();
  });

  it.skip('copies the current URL and shows toast on the 404 page secondary action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotFoundPage />);

    await user.click(screen.getByRole('button', { name: /copy broken link/i }));

    expect(clipboardSpy?.writeText).toHaveBeenCalledWith(window.location.href);
    expect(toast.success).toHaveBeenCalled();
  });

  it.skip('renders incident diagnostics and copies the incident ID on the 500 page', async () => {
    const user = userEvent.setup();
    const uuidSpy = globalThis.crypto?.randomUUID
      ? vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('deadbeef-dead-beef-dead-beefdeadbeef')
      : null;

    renderWithProviders(<ErrorPage />);

    expect(screen.getByText('Incident ID')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /copy incident id/i }));

    expect(clipboardSpy?.writeText).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();

    uuidSpy?.mockRestore();
  });
});
