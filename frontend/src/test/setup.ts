/**
 * @file frontend/src/test/setup.ts
 * @description Test environment setup for Vitest
 */

import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = vi.fn();

// Mock hasPointerCapture for Radix UI components
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock DiceLoader to avoid WebGL dependency in tests
vi.mock('../components/ui/dice-loader', () => {
  function DiceLoader({ message }: { message?: string }) {
    return React.createElement('div', { 'data-testid': 'dice-loader' }, message ?? null);
  }

  return {
    DiceLoader,
  };
});
