import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { Core } from '@strapi/strapi';

// Standardized Tool Result Interface
export interface ToolResult {
  data: unknown; // The structured data returned
  display: string; // The human-readable string for the LLM
}

export type StrapiContext = {
  strapi: Core.Strapi;
  roomDocumentId: string;
  mode?: 'game' | 'debug';
};

// Backwards compatibility alias
export type StrapiInterface = Core.Strapi;

/**
 * Creates a standardized Daicer tool with strict input/output validation.
 */
export const createDaicerTool = <
  TInput extends z.ZodObject<z.ZodRawShape>,
  TOutput extends z.ZodType<unknown> = z.ZodType<unknown>,
>(
  config: {
    name: string;
    description: string;
    schema: TInput;
    outputSchema?: TOutput; // Optional strict output schema validation
    func: (input: z.infer<TInput>, context: StrapiContext) => Promise<unknown>;
  },
  context: StrapiContext
) => {
  return new DynamicStructuredTool({
    name: config.name,
    description: config.description,
    schema: config.schema,
    func: async (input) => {
      try {
        const result = await config.func(input as z.infer<TInput>, context);

        // Validate output if schema provided
        if (config.outputSchema) {
          try {
            config.outputSchema.parse(result);
          } catch (validationError) {
            console.error(`[Tool: ${config.name}] Output validation failed:`, validationError);
            throw new Error(
              `Tool output validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`
            );
          }
        }

        // Return strictly the string representation for the LLM's observation
        // The LLM expects a string.
        if (typeof result === 'string') return result;
        return JSON.stringify(result);
      } catch (error) {
        // Standardized error handling
        return `Error executing ${config.name}: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};
