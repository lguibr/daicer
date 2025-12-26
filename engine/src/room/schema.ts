import { z } from 'zod';
import { GamePhase } from './types';

const dmStyleSchema = z.object({
  verbosity: z.number().int().min(0).max(6),
  detail: z.number().int().min(0).max(6),
  engagement: z.number().int().min(0).max(6),
  narrative: z.number().int().min(0).max(6),
  specialMode: z.enum(['pirate', 'shakespearean', 'noir', 'courtly', 'grimdark', 'storybook']).nullable().optional(),
  customDirectives: z.string(),
});

const worldSettingsSchema = z.object({
  worldType: z.enum(['terra', 'water', 'desert', 'ice', 'volcanic', 'forest', 'sky', 'underground', 'custom']),
  worldSize: z.enum(['intimate', 'small', 'medium', 'large', 'vast', 'epic']),
  theme: z.string().min(1),
  setting: z.string().min(1),
  tone: z.string().min(1),
  worldBackground: z.string().min(1),
  dmStyle: dmStyleSchema,
  dmSystemPrompt: z.string().min(1),
  playerCount: z.number().int().min(1).max(8),
  adventureLength: z.enum(['flash', 'short', 'medium', 'long', 'epic', 'legendary']),
  difficulty: z.enum(['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly']),
  startingLevel: z.number().int().min(1).max(20),
  attributePointBudget: z.number().int().min(0),
  language: z.enum(['en', 'es', 'pt-BR']),
  historyDepth: z.number().int().min(0).max(10000).default(0),
  structureDensity: z.enum(['sparse', 'normal', 'dense']).default('normal'),
  enableRoads: z.boolean().default(true),
});

export const roomSchema = z.object({
  id: z.string().min(1),
  code: z.string().length(6),
  ownerId: z.string().min(1),
  settings: worldSettingsSchema.nullable(),
  worldDescription: z.string(),
  phase: z.nativeEnum(GamePhase),
  createdAt: z.number(),
  updatedAt: z.number(),
  isActive: z.boolean().optional(),
});

export { worldSettingsSchema };
