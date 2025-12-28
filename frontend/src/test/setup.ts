/**
 * @file frontend/src/test/setup.ts
 * @description Test environment setup for Vitest
 */

import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock scrollIntoView and scrollTo for JSDOM
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn();

// Mock hasPointerCapture for Radix UI components
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}

// Mock useLayoutEffect to avoid "useLayoutEffect does nothing on the server" warnings or null pointer in Radix
// Radix UI sometimes fails in JSDOM if useLayoutEffect is not consistent
if (typeof window !== 'undefined') {
  React.useLayoutEffect = React.useEffect;
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

// Mock Canvas 2D Context for canvas-based tests
HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      translate: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([128, 128, 128, 255]),
        width: 1,
        height: 1,
      })),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

// Mock DiceLoader to avoid WebGL dependency in tests
vi.mock('../components/ui/dice-loader', () => {
  function DiceLoader({ message }: { message?: string }) {
    return React.createElement('div', { 'data-testid': 'dice-loader' }, message ?? null);
  }

  return {
    DiceLoader,
    default: DiceLoader,
  };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cb: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(cb: any) {
    this.cb = cb;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  observe(target: any) {
    // Trigger callback immediately with a default size
    this.cb([
      {
        target,
        contentRect: {
          width: 1000,
          height: 1000,
          top: 0,
          left: 0,
          bottom: 1000,
          right: 1000,
          x: 0,
          y: 0,
        },
      },
    ]);
  }

  // eslint-disable-next-line class-methods-use-this
  unobserve() {}

  // eslint-disable-next-line class-methods-use-this
  disconnect() {}
};
