import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url(),
  avatarUrl: z.string().url().nullable().optional(),
  role: z.enum(['free', 'premium', 'god']),
  language: z.string().optional(),
  createdAt: z.union([z.string(), z.number()]),
  updatedAt: z.string().optional(),
  lastTokenRefresh: z.string().optional(),
  tokensRevokedAt: z.string().optional(),
});
