import { z } from 'zod';

/**
 * Entity Schema
 * Represents a movable entity on the map (PC, NPC, Creature)
 */

export const EntityTypeEnum = z.enum([
  'player',
  'npc',
  'creature',
  'object', // Movable objects like carts, boulders
]);

export type EntityType = z.infer<typeof EntityTypeEnum>;

export const EntitySchema = z.object({
  id: z.string(),
  roomId: z.string(),
  type: EntityTypeEnum,
  name: z.string(),
  // Position
  x: z.number(), // World X
  y: z.number(), // World Y
  z: z.number().default(0), // Layer
  // Visuals
  avatarUrl: z.string().optional(),
  color: z.string().optional(),
  scale: z.number().default(1),
  // Stats/State
  visibilityRadius: z.number().default(10), // How far this entity can see (Fog of War)
  isPublic: z.boolean().default(true), // If false, only visible to DM and owner
  ownerId: z.string().optional(), // For PCs
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Entity = z.infer<typeof EntitySchema>;
