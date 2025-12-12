/**
 * Centralized Zod schemas for all LLM structured outputs
 * Ported for Strapi
 */

import { z } from 'zod';

/**
 * DM Turn Response Schema
 */
export const TurnResponseSchema = z.object({
  overall_summary: z.string().describe('The main narrative summary visible to all players'),
  player_perspectives: z
    .array(
      z.object({
        playerName: z.string().describe('Name of the player character'),
        perspective: z
          .string()
          .describe('Personalized perspective for this specific player based on their position and senses'),
      })
    )
    .describe('Individual perspectives for each player based on their location'),
  metadata: z
    .object({
      tone: z.enum(['dramatic', 'casual', 'epic', 'tense', 'mysterious']).describe('Narrative tone of this response'),
      containsCombat: z.boolean().describe('Whether this response indicates combat is starting'),
      suggestedActions: z.array(z.string()).nullable().describe('Suggested next actions for players (null if none)'),
    })
    .nullable(),
});

export type TurnResponse = z.infer<typeof TurnResponseSchema>;

/**
 * World Description Schema
 */
export const WorldDescriptionSchema = z.object({
  title: z.string().describe('Campaign title'),
  description: z.string().describe('Rich markdown-formatted world description (2-3 paragraphs)'),
  atmosphere: z.string().describe('Single sentence capturing the mood and atmosphere'),
  keyLocations: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      })
    )
    .describe('2-4 key locations in this world'),
  threats: z.array(z.string()).describe('Primary dangers or antagonistic forces'),
  hooks: z.array(z.string()).describe('Adventure hooks to draw players in'),
  metadata: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard', 'deadly']),
    theme: z.string(),
    setting: z.string(),
  }),
});

export type WorldDescription = z.infer<typeof WorldDescriptionSchema>;

/**
 * Combat Narration Schema
 */
export const CombatNarrationSchema = z.object({
  narration: z.string().describe('Dramatic description of the combat action'),
  outcome: z.enum(['hit', 'miss', 'critical_hit', 'critical_miss', 'effect_applied', 'effect_resisted']),
  impactDescription: z.string().nullable().describe('Description of the impact/consequence (null if none)'),
  metadata: z
    .object({
      tone: z.enum(['brutal', 'heroic', 'desperate', 'tactical']),
      visualCues: z.array(z.string()).nullable().describe('Visual effects for frontend animation (null if none)'),
    })
    .nullable(),
});

export type CombatNarration = z.infer<typeof CombatNarrationSchema>;

/**
 * Character Opening Schema
 */
export const CharacterOpeningSchema = z.object({
  opening: z.string().describe('Personal opening scene for this character'),
  atmosphere: z.string().describe('Mood and sensory details'),
  immediateContext: z.string().describe('What the character sees/hears/feels right now'),
  hook: z.string().describe('The call to adventure or immediate challenge'),
  metadata: z.object({
    tone: z.enum(['mysterious', 'urgent', 'calm', 'ominous']),
  }),
});

export type CharacterOpening = z.infer<typeof CharacterOpeningSchema>;

/**
 * Historical Period Response Schema
 */
export const HistoricalPeriodResponseSchema = z.object({
  narrative: z.string().describe('Rich markdown narrative of events this period'),
  structures: z
    .array(
      z.object({
        name: z.string(),
        relativePosition: z.object({
          direction: z.enum([
            'north',
            'south',
            'east',
            'west',
            'northeast',
            'northwest',
            'southeast',
            'southwest',
            'central',
          ]),
          distance: z.enum(['near', 'moderate', 'far']),
        }),
        size: z.enum(['tiny', 'small', 'medium', 'large', 'huge']),
        description: z.string(),
        type: z.enum(['settlement', 'dungeon', 'landmark', 'ruin', 'natural']),
        significance: z.number().min(1).max(10),
      })
    )
    .describe('Structures created or significant during this period'),
  majorEvents: z.array(z.string()).describe('Key events as bullet points'),
  // Required field but can be null (OpenAI Structured Outputs doesn't support .optional())
  populationChange: z.enum(['decline', 'stable', 'growth', 'boom']).nullable(),
});

export type HistoricalPeriodResponse = z.infer<typeof HistoricalPeriodResponseSchema>;

/**
 * Simple Narrative Response
 */
export const NarrativeResponseSchema = z.object({
  content: z.string().describe('The narrative content'),
  // Required field but can be null (OpenAI Structured Outputs doesn't support .optional())
  metadata: z
    .object({
      tone: z.enum(['dramatic', 'casual', 'epic', 'tense', 'mysterious', 'humorous']).nullable(),
      language: z.enum(['en', 'es', 'pt-BR']).default('en'),
    })
    .nullable(),
});

export type NarrativeResponse = z.infer<typeof NarrativeResponseSchema>;

/**
 * Tool Response Schema
 */
export const ToolResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().nullable(),
  error: z.string().nullable(),
});

export type ToolResponse = z.infer<typeof ToolResponseSchema>;
