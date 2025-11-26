/**
 * Centralized Zod validators for room API endpoints
 */

import { z } from 'zod';

/**
 * World settings schema
 */
export const worldSettingsSchema = z.object({
    worldType: z.enum(['terra', 'water', 'desert', 'ice', 'volcanic', 'forest', 'sky', 'underground', 'custom']),
    worldSize: z.enum(['intimate', 'small', 'medium', 'large', 'vast', 'epic']),
    theme: z.string(),
    setting: z.string(),
    tone: z.string(),
    worldBackground: z.string(),
    dmStyle: z.object({
        verbosity: z.number().min(0).max(6),
        detail: z.number().min(0).max(6),
        engagement: z.number().min(0).max(6),
        narrative: z.number().min(0).max(6),
        specialMode: z.enum(['pirate', 'shakespearean', 'noir', 'courtly', 'grimdark', 'storybook']).nullable().optional(),
        customDirectives: z.string(),
    }),
    dmSystemPrompt: z.string(),
    playerCount: z.number().min(1).max(8),
    adventureLength: z.enum(['flash', 'short', 'medium', 'long', 'epic', 'legendary']),
    difficulty: z.enum(['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly']),
    startingLevel: z.number().min(1).max(20),
    attributePointBudget: z.number().min(0),
    language: z.enum(['en', 'es', 'pt-BR']),
    historyDepth: z.number().optional(),
    eraCount: z.number().optional(),
    structureDensity: z.number().optional(),
    structureTypes: z.array(z.string()).optional(),
    enableRoads: z.boolean().optional(),
    roadQuality: z.string().optional(),
    terrainComplexity: z.number().optional(),
});

/**
 * Room ID parameter schema
 */
export const roomIdParamSchema = z.object({
    roomId: z.string().min(1, 'Room ID is required'),
});

/**
 * Join code parameter schema
 */
export const joinCodeParamSchema = z.object({
    code: z.string().regex(/^[A-Z0-9]{6}$/, 'Invalid room code format'),
});

/**
 * Structures near query schema
 */
export const structuresNearQuerySchema = z.object({
    x: z.coerce.number(),
    y: z.coerce.number(),
    radius: z.coerce.number().default(96),
});
