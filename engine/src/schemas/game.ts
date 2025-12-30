import { z } from 'zod';

export const ScaleLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const AdventureLengthSchema = z.enum(['flash', 'short', 'medium', 'long', 'epic', 'legendary']);

export const DifficultySchema = z.enum(['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly']);

export const LanguageSchema = z.enum(['en', 'es', 'pt-BR']);

export const WorldTypeSchema = z.enum([
  'terra',
  'water',
  'desert',
  'ice',
  'volcanic',
  'forest',
  'sky',
  'underground',
  'custom',
]);

export const WorldSizeSchema = z.enum(['intimate', 'small', 'medium', 'large', 'vast', 'epic']);

export const DMPerformanceModeSchema = z.enum(['pirate', 'shakespearean', 'noir', 'courtly', 'grimdark', 'storybook']);

export const DMStyleSchema = z.object({
  verbosity: ScaleLevelSchema,
  detail: ScaleLevelSchema,
  engagement: ScaleLevelSchema,
  narrative: ScaleLevelSchema,
  specialMode: DMPerformanceModeSchema.optional().nullable(),
  customDirectives: z.string(),
});

// Fix z.record usage
export const WorldSettingsSchema = z.object({
  worldType: WorldTypeSchema,
  worldSize: WorldSizeSchema,
  theme: z.string(),
  setting: z.string(),
  tone: z.string(),
  worldBackground: z.string(),
  dmStyle: DMStyleSchema,
  dmSystemPrompt: z.string(),
  playerCount: z.number(),
  adventureLength: AdventureLengthSchema,
  difficulty: DifficultySchema,
  startingLevel: z.number(),
  attributePointBudget: z.number(),
  language: LanguageSchema,
  historyDepth: z.number().optional(),
  eraCount: z.number().optional(),
  structureDensity: z.number().optional(),
  structureTypes: z.array(z.string()).optional(),
  enableRoads: z.boolean().optional(),
  roadQuality: z.string().optional(),
  terrainComplexity: z.number().optional(),
  seed: z.string().optional(),
  generationParams: z.record(z.string(), z.any()).optional(), // Explicit key type
});

export const MapConfigSchema = z.object({
  seed: z.string(),
  gridEnabled: z.boolean(),
  biomeBias: z.record(z.string(), z.number()).optional(), // Explicit key type
  globalWaterLevel: z.number().optional(),
  globalTemperature: z.number().optional(),
  renderSettings: z
    .object({
      showGrid: z.boolean(),
      showCoordinates: z.boolean(),
      fogOfWar: z.boolean(),
    })
    .optional(),
});

export const GamePhaseSchema = z.enum([
  'SETUP',
  'TERRAIN_GENERATION',
  'CHARACTER_CREATION',
  'GAMEPLAY',
  'COMBAT',
  'LOBBY',
  'PAUSED',
  'ENDED',
]);

export const RoleSchema = z.enum(['dm', 'player', 'spectator', 'god', 'premium', 'free']);

export const AvatarPreviewImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
});

// Circular references handled by z.any() or simpler types for now
// Define TimeFrameSchema
export const TimeFrameSchema = z.object({
  id: z.string(),
  turnNumber: z.number(),
  timestamp: z.string(),
  gameState: z.object({
    world: z.any(),
    entities: z.array(z.any()), // EntitySchema circular ref
    settings: WorldSettingsSchema,
    mapConfig: z.any(),
  }),
});

export const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  user: z
    .object({
      id: z.string(),
      documentId: z.string().optional(),
      username: z.string(),
    })
    .optional(),
  name: z.string(),
  role: RoleSchema,
  isOnline: z.boolean().optional(),
  character: z.any().nullable(), // CharacterSheetSchema circular ref
  characterSheet: z.any().nullable().optional(), // The Instantiated Sheet (ID or Object)
  action: z.string().nullable(),
  isReady: z.boolean(),
  joinedAt: z.number(),
  updatedAt: z.number().optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  avatarPreview: z
    .object({
      portrait: AvatarPreviewImageSchema,
      upperBody: AvatarPreviewImageSchema,
      fullBody: AvatarPreviewImageSchema,
    })
    .optional(),
});

export const RoomSchema = z.object({
  id: z.string(),
  documentId: z.string().optional(),
  roomId: z.string().optional(),
  slug: z.string().optional(),
  name: z.string().optional(),
  config: z.any().optional(),
  code: z.string(),
  ownerId: z.string(),
  owner: z
    .object({
      id: z.string(),
      documentId: z.string().optional(),
      username: z.string(),
    })
    .optional(),
  players: z.array(PlayerSchema).optional(),
  settings: WorldSettingsSchema.nullable(),
  mapConfig: MapConfigSchema.optional(),
  worldDescription: z.string(),
  worldHistory: z.any().optional(),
  structures: z.array(z.any()).optional(),
  roads: z.array(z.any()).optional(),
  worldConditions: z.array(z.any()).optional(),
  phase: GamePhaseSchema,
  turnData: z
    .object({
      phase: z.enum(['idle', 'waiting_for_actions', 'processing']),
      actions: z.array(z.any()),
    })
    .optional(),
  terrainData: z.any().optional(),
  characterCreationLocked: z.boolean().optional(),
  generationEvents: z.array(z.any()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  isActive: z.boolean().optional(),
  timeFrames: z.array(TimeFrameSchema).optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  recipientId: z.string().optional(),
  text: z.string(),
  images: z.array(z.string()).optional(),
  timestamp: z.number(),
  targetPlayer: z.string().optional(),
  type: z.enum(['talk', 'narration', 'system', 'text', 'narrative']).optional(),
  metadata: z.record(z.string(), z.any()).optional(), // Explicit key type
});
