import { z } from 'zod';
import { CoordinatesSchema } from './common';

export const MapMovePayloadSchema = z.object({
  entityId: z.union([z.string(), z.number()]),
  from: CoordinatesSchema,
  to: CoordinatesSchema,
});

export type MapMovePayload = z.infer<typeof MapMovePayloadSchema>;

export const GameEventPayloadSchema = z.union([
  z.object({ type: z.literal('MOVE'), payload: MapMovePayloadSchema }),
  z.object({ type: z.string(), payload: z.record(z.unknown()) }),
]);

export type GameEventStrict = z.infer<typeof GameEventPayloadSchema>;

// Socket Payloads

export const RoomJoinSchema = z.object({
  roomId: z.string(),
  userId: z.string().optional(),
});

export type RoomJoinPayload = z.infer<typeof RoomJoinSchema>;

export const TurnProcessSchema = z.object({
  roomId: z.string(),
  language: z.string().optional(),
});

export type TurnProcessPayload = z.infer<typeof TurnProcessSchema>;

export const PlayerActionSchema = z.object({
  roomId: z.string(),
  action: z.string(),
});

export type PlayerActionPayload = z.infer<typeof PlayerActionSchema>;
