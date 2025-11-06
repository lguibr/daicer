/**
 * Vitest test setup
 */

import '@testing-library/jest-dom';

// Mock Firebase
vi.mock('../services/firebase', () => ({
  auth: {},
  db: {},
}));

// Mock Socket.io
vi.mock('../services/socket', () => ({
  initSocket: vi.fn(),
  getSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  submitAction: vi.fn(),
  processTurn: vi.fn(),
  disconnectSocket: vi.fn(),
  isConnected: vi.fn(() => false),
}));

