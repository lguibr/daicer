/**
 * LoginScreen component tests
 */

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import LoginScreen from '../LoginScreen';
import useAuth from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

describe('LoginScreen', () => {
  test('renders login button', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    render(<LoginScreen />);
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
  });

  test('calls signInWithGoogle on button click', async () => {
    const mockSignIn = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signInWithGoogle: mockSignIn,
      signOut: vi.fn(),
    });

    render(<LoginScreen />);
    const button = screen.getByText(/Continue with Google/i);
    fireEvent.click(button);

    expect(mockSignIn).toHaveBeenCalled();
  });

  test('shows loading state', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    render(<LoginScreen />);
    expect(screen.getByText(/Logging in.../i)).toBeInTheDocument();
  });

  test('displays error message', () => {
    const errorMessage = 'Authentication failed';

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: errorMessage,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
    });

    render(<LoginScreen />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
