import type { User } from './types';

export const PRESET_USER_FREE: User = {
  id: 'user-free-1',
  email: 'free@example.com',
  displayName: 'Free User',
  photoURL: 'https://example.com/avatar.png',
  avatarUrl: null,
  role: 'free',
  language: 'en',
  createdAt: 1700000000000,
  updatedAt: '2024-01-01T00:00:00Z',
};

export const PRESET_USER_PREMIUM: User = {
  id: 'user-premium-1',
  email: 'premium@example.com',
  displayName: 'Premium User',
  photoURL: 'https://example.com/avatar-premium.png',
  avatarUrl: null,
  role: 'premium',
  language: 'en',
  createdAt: 1700000000000,
  updatedAt: '2024-01-01T00:00:00Z',
};

export const PRESET_USER_GOD: User = {
  id: 'user-god-1',
  email: 'admin@example.com',
  displayName: 'Admin User',
  photoURL: 'https://example.com/avatar-admin.png',
  avatarUrl: null,
  role: 'god',
  language: 'en',
  createdAt: 1700000000000,
  updatedAt: '2024-01-01T00:00:00Z',
};

export const PRESET_USERS = {
  free: PRESET_USER_FREE,
  premium: PRESET_USER_PREMIUM,
  god: PRESET_USER_GOD,
};
