import { z } from 'zod';

const avatarPreviewImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});

export const playerSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  character: z.any(), // Will be characterSheetSchema from character module
  action: z.string().nullable(),
  isReady: z.boolean(),
  joinedAt: z.number(),
  updatedAt: z.number().optional(),
  avatarPreview: z
    .object({
      portrait: avatarPreviewImageSchema,
      upperBody: avatarPreviewImageSchema,
      fullBody: avatarPreviewImageSchema,
    })
    .optional(),
});

export const messageSchema = z.object({
  id: z.string().min(1),
  sender: z.union([z.literal('DM'), z.string()]),
  recipientId: z.string().optional(),
  text: z.string().min(1),
  images: z.array(z.string().url()).optional(),
  timestamp: z.number(),
  targetPlayer: z.string().optional(),
});
