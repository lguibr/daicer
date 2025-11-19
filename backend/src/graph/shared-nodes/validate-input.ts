/**
 * Validate Input Shared Node
 * Zod validation wrapper for graph entry points
 */

import { z } from 'zod';
import { logger } from '@/utils/logger';

/**
 * Validation error with context
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public context?: {
      errors?: z.ZodIssue[];
      state?: unknown;
    }
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Create validation node for graph input
 * Validates entire state against schema at entry point
 *
 * @param schema - Zod schema to validate against
 * @param nodeName - Node name for error messages
 * @returns Validation node function
 *
 * @example
 * ```typescript
 * const validateInput = createValidateInputNode(DMStoryStateSchema, 'dm_story_graph');
 * graph.addNode('validate_input', validateInput);
 * ```
 */
export function createValidateInputNode<TSchema extends z.ZodTypeAny>(schema: TSchema, nodeName: string) {
  return async (state: z.infer<TSchema>): Promise<Partial<z.infer<TSchema>>> => {
    logger.debug(`[${nodeName}] Validating input state`);

    try {
      // Validate entire input state
      schema.parse(state);

      logger.info(`[${nodeName}] Input validation passed`);

      // Return empty partial (validation only, no mutation)
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`[${nodeName}] Input validation failed:`, {
          errors: error.issues,
          state: JSON.stringify(state).slice(0, 500), // Truncate for logs
        });

        throw new ValidationError(`${nodeName} input validation failed`, {
          errors: error.issues,
          state,
        });
      }
      throw error;
    }
  };
}
