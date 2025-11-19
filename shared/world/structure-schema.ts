import { z } from 'zod';

export const StructureSizeEnum = z.enum(['tiny', 'small', 'medium', 'large', 'huge']);

export const StructureSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  size: StructureSizeEnum,
  width: z.number().min(16).max(8096).optional(), // Tile width (16-8096)
  height: z.number().min(16).max(8096).optional(), // Tile height (16-8096)
  description: z.string(),
  era: z.number(),
  type: z.enum(['settlement', 'dungeon', 'landmark', 'ruin', 'natural']),
  significance: z.number().min(1).max(10),
  relativePosition: z.string().optional(), // For history generation
  userId: z.string().optional(), // For user-created structures
});

export type StructureSize = z.infer<typeof StructureSizeEnum>;
export type Structure = z.infer<typeof StructureSchema>;
