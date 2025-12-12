import { z } from 'zod';

export const AssetTypeEnum = z.enum(['2d', '3d', 'map', 'structures', 'character-sheet']);
export const AssetStatusEnum = z.enum(['pending', 'loading', 'done', 'error']);
export const CollectionModeEnum = z.enum(['variations', 'text-to-image', 'batch-transform', 'batch-create']);

export const ModelPartSchema = z.object({
  shape: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  color: z.string(),
});

export const ModelDataSchema = z.object({
  name: z.string(),
  parts: z.array(ModelPartSchema),
  rotation: z.tuple([z.number(), z.number(), z.number()]).optional(),
  scale: z.tuple([z.number(), z.number(), z.number()]).optional(),
});

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  createdBy: z.string(),
  color: z.string().optional(),
  assetType: AssetTypeEnum,
  mode: CollectionModeEnum.optional(),
  baseImageId: z.string().optional(),
  masterDescription: z.string().optional(),
});

export const AssetSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  collectionId: z.string(),
  name: z.string(),
  description: z.string(),
  assetType: AssetTypeEnum,
  status: AssetStatusEnum,
  generationPrompt: z.string().optional(),
  storageUrl: z.string().optional(),
  modelData: ModelDataSchema.optional(),
  type: AssetTypeEnum.optional(), // Alias for backward compatibility
});

export const WorldMapSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  seed: z.string(),
  parameters: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  createdBy: z.string(),
});

export type ModelPart = z.infer<typeof ModelPartSchema>;
export type ModelData = z.infer<typeof ModelDataSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type WorldMap = z.infer<typeof WorldMapSchema>;
