import { z } from 'zod';

export const RoomJoinSchema = z.object({
  roomId: z.string().min(1, 'roomId must be a non-empty string'),
  userId: z.string().optional(),
});

export type RoomJoinPayload = z.infer<typeof RoomJoinSchema>;

export const TurnProcessSchema = z.object({
  roomId: z.string().min(1, 'roomId must be a non-empty string'),
  language: z.string().optional(),
});

export type TurnProcessPayload = z.infer<typeof TurnProcessSchema>;

export const PlayerActionSchema = z.object({
  roomId: z.string().min(1, 'roomId must be a non-empty string'),
  action: z.unknown(), // Flexible for now
});

export type PlayerActionPayload = z.infer<typeof PlayerActionSchema>;
