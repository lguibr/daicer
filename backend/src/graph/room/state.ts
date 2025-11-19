/**
 * Room Management Graph State
 * Handles room-level state transitions
 */

import { z } from 'zod';

export const RoomManagementStateSchema = z.object({
  roomId: z.string(),
  characterCreationLocked: z.boolean(),
  phase: z.string(),
  updatedAt: z.number(),
});

export type RoomManagementState = z.infer<typeof RoomManagementStateSchema>;
