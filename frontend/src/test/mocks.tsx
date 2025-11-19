import { vi } from 'vitest';

/**
 * @file frontend/src/test/mocks.tsx
 * @description Shared test mocks and utilities
 */

export const mockScrollIntoView = () => {
  Element.prototype.scrollIntoView = vi.fn();
};

export const mockPointerCapture = () => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  }
};
