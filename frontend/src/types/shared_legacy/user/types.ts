/**
 * User and authentication types
 */

export type Role = 'free' | 'premium' | 'god';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  avatarUrl?: string | null;
  role: Role;
  language?: string;
  createdAt: string | number;
  updatedAt?: string;
  lastTokenRefresh?: string;
  tokensRevokedAt?: string;
}

export type LLMProvider = 'gemini';
