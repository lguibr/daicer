import { z } from 'zod';
import { ChatAnthropic } from '@langchain/anthropic';
import { logger } from '@/utils/logger';

// --- INTENT SCHEMAS ---

export const IntentTypeSchema = z.enum(['MOVE', 'ATTACK', 'CAST_SPELL', 'INTERACT', 'CHECK', 'OTHER']);

export type IntentType = z.infer<typeof IntentTypeSchema>;

export const MoveIntentSchema = z.object({
  type: z.literal('MOVE'),
  target: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    z: z.number().optional(),
    entityName: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const AttackIntentSchema = z.object({
  type: z.literal('ATTACK'),
  target: z.string().describe('Target entity name'),
  weapon: z.string().optional(),
});

export const CastSpellIntentSchema = z.object({
  type: z.literal('CAST_SPELL'),
  spell: z.string(),
  target: z.string().optional(),
  area: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const InteractIntentSchema = z.object({
  type: z.literal('INTERACT'),
  target: z.string(),
  action: z.string(),
});

// Union for parsing
export const GameIntentSchema = z.union([
  MoveIntentSchema,
  AttackIntentSchema,
  CastSpellIntentSchema,
  InteractIntentSchema,
  z.object({ type: z.literal('CHECK'), skill: z.string() }),
  z.object({ type: z.literal('OTHER'), description: z.string() }),
]);

export type GameIntent = z.infer<typeof GameIntentSchema>;

export class IntentParser {
  private model: ChatAnthropic;

  constructor() {
    this.model = new ChatAnthropic({
      modelName: 'claude-3-haiku-20240307', // Faster/Cheaper model for parsing
      temperature: 0,
    });
  }

  /**
   * Parse a raw user string into a structured GameIntent
   */
  async parseIntent(input: string): Promise<GameIntent> {
    const parser = this.model.withStructuredOutput(GameIntentSchema, {
      name: 'parse_intent',
    });

    try {
      const result = await parser.invoke([
        {
          role: 'system',
          content: `You are a strict intent parser for a D&D game. 
          Map the user's input to one of the allowed schemas. 
          If unclear, fallback to OTHER.
          Context: Grid Combat. Moves require coordinates or target references.`,
        },
        { role: 'user', content: input },
      ]);

      logger.info(`[IntentParser] Parsed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error('[IntentParser] Failed to parse intent', error);
      return { type: 'OTHER', description: input };
    }
  }
}

export const intentParser = new IntentParser();
