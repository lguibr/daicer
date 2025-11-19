/**
 * Tactical Combat Schemas
 * Zod validation schemas for tactical encounters and combat actions
 */

import { z } from 'zod';

export const positionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const unitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(1),
  ac: z.number().int().min(0),
  initiative: z.number(),
  position: positionSchema,
  allegiance: z.enum(['player', 'enemy', 'neutral']).optional(),
  isActive: z.boolean().optional(),
  conditions: z.array(z.string()).optional(),
});

export const gridSizeSchema = z.object({
  width: z.number().int().min(5).max(50),
  height: z.number().int().min(5).max(50),
});

export const encounterSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  gridSize: gridSizeSchema,
  enemies: z.array(unitSchema),
  seed: z.number().int().optional(),
  terrainDensity: z.number().min(0).max(1).optional(),
});

export const actionSchema = z.object({
  type: z.enum(['attack', 'move', 'spell', 'ability', 'item', 'dash', 'dodge', 'help', 'hide', 'ready']),
  actorId: z.string().min(1),
  targetId: z.string().optional(),
  targetPosition: positionSchema.optional(),
  weaponId: z.string().optional(),
  spellId: z.string().optional(),
  itemId: z.string().optional(),
  abilityId: z.string().optional(),
  distance: z.number().optional(),
});

export const encounterUpdateSchema = z.object({
  round: z.number().int().min(1).optional(),
  turn: z.number().int().min(0).optional(),
  phase: z.enum(['pending', 'in_progress', 'paused', 'complete']).optional(),
  units: z.array(unitSchema).optional(),
  log: z.array(z.string()).optional(),
});

export type Position = z.infer<typeof positionSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type GridSize = z.infer<typeof gridSizeSchema>;
export type Encounter = z.infer<typeof encounterSchema>;
export type Action = z.infer<typeof actionSchema>;
export type EncounterUpdate = z.infer<typeof encounterUpdateSchema>;
