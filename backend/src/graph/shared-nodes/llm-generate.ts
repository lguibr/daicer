/**
 * LLM Generate Shared Node
 * Generic LLM invocation with Zod schema validation
 * Reusable across all section graphs
 */

import { task } from '@langchain/langgraph';
import { z } from 'zod';
import { generateStructuredTask } from '@/services/llm/structured';
import type { Language } from '@/types/index';
import { logger } from '@/utils/logger';

/**
 * LLM generation parameters
 */
export interface LLMGenerateParams<TSchema extends z.ZodTypeAny> {
  schema: TSchema;
  systemPrompt: string;
  userPrompt: string;
  tags?: string[];
  temperature?: number;
  model?: 'flash' | 'pro';
}

/**
 * Create LLM generation node (reusable pattern)
 * Wraps LLM call in task() for determinism
 *
 * @param taskName - Unique task name for LangSmith tracing
 * @param params - LLM generation parameters
 * @returns Task function that can be awaited
 *
 * @example
 * ```typescript
 * const generateTask = createLLMGenerateNode('generate_conditions', {
 *   schema: WorldConditionResponseSchema,
 *   systemPrompt: 'You are a world-builder...',
 *   userPrompt: `Theme: ${state.settings.theme}`,
 *   tags: ['world-conditions'],
 * });
 *
 * const result = await generateTask({ language: 'en' });
 * ```
 */
export const createLLMGenerateNode = <TSchema extends z.ZodTypeAny>(
  taskName: string,
  params: LLMGenerateParams<TSchema>
) => {
  const generateTask = task(
    taskName,
    async (context: { language?: Language; userId?: string }): Promise<z.infer<TSchema>> => {
      logger.info(`[${taskName}] Starting LLM generation`, {
        language: context.language || 'en',
        userId: context.userId,
        tags: params.tags,
      });

      const result = await generateStructuredTask(
        params.schema,
        params.systemPrompt,
        params.userPrompt,
        context.language || 'en',
        {
          tags: params.tags || [],
          userId: context.userId,
          temperature: params.temperature,
          // Don't pass model field if not specified (let service choose)
        }
      );

      // Validate result against schema
      const validated = params.schema.parse(result);

      logger.info(`[${taskName}] LLM generation complete`);

      return validated;
    }
  );

  return generateTask;
};

/**
 * Helper to build LLM context from state
 * Extracts language and userId for task invocation
 */
export function buildLLMContext(
  state: { language?: Language },
  userId?: string
): { language?: Language; userId?: string } {
  return {
    language: state.language || 'en',
    userId,
  };
}
