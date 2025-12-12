import { z } from 'zod';

/**
 * Grid Tile Schema
 * Represents a single tile in the infinite grid system
 */

export const BlockTypeEnum = z.enum([
  'air',
  'water',
  'ice',
  'grass',
  'dirt',
  'stone',
  'sand',
  'gravel',
  'clay',
  'snow',
  'packed_ice',
  'sandstone',
  'terracotta',
  'red_sand',
  'podzol',
  'mycelium',
  'basalt',
  'blackstone',
  'mud',
  'deepslate',
  'bedrock',
  'coal_ore',
  'iron_ore',
  'gold_ore',
  'diamond_ore',
  'emerald_ore',
  'lapis_ore',
  'redstone_ore',
]);

export type BlockType = z.infer<typeof BlockTypeEnum>;

export const GridTileSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  z: z.union([z.literal(-3), z.literal(-2), z.literal(-1), z.literal(0), z.literal(1), z.literal(2), z.literal(3)]), // Z-layer index (-3 to +3)
  blockType: BlockTypeEnum,
  biome: z.string(),
  elevation: z.number().optional(), // Surface elevation at this position
  lightLevel: z.number().int().min(0).max(15).default(0),
  metadata: z.record(z.string(), z.unknown()).optional(), // Additional tile data
});

export type GridTile = z.infer<typeof GridTileSchema>;
