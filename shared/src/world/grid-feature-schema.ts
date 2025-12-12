import { z } from 'zod';

/**
 * Grid Feature Schema
 * Represents entities/features that exist on tiles (trees, creatures, resources, etc.)
 */

export const FeatureTypeEnum = z.enum([
  'tree',
  'creature',
  'resource',
  'npc',
  'item',
  'hazard',
  'decoration',
  'structure_marker',
]);

export type FeatureType = z.infer<typeof FeatureTypeEnum>;

export const GridFeatureSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number().int(),
    y: z.number().int(),
    z: z.number().int().min(-6).max(5),
  }),
  type: FeatureTypeEnum,
  subtype: z.string(), // e.g., 'oak_tree', 'goblin', 'iron_ore', 'ancient_statue'
  name: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()), // JSON for any feature-specific data
  isVisible: z.boolean().default(true),
  isWalkable: z.boolean().default(true),
  blocksLineOfSight: z.boolean().default(false),
  interactable: z.boolean().default(false),
});

export type GridFeature = z.infer<typeof GridFeatureSchema>;
