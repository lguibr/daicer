import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Standardized Tool Result Interface
export interface ToolResult {
  data: any; // The structured data returned
  display: string; // The human-readable string for the LLM
}

// Undefine 'any' for Strapi by defining a minimal interface we actually use
export interface StrapiService {
  [key: string]: any; // fallback for services we don't fully type yet, but we should try to restrict
}

export interface StrapiDocumentService {
  findOne: (params: any) => Promise<any>;
  findMany: (params: any) => Promise<any[]>;
  create: (params: any) => Promise<any>;
  update: (params: any) => Promise<any>;
  // ... add more as needed
}

export interface StrapiInterface {
  service(uid: string): any; // Ideally typed, but service lookups are dynamic in Strapi
  documents(uid: string): StrapiDocumentService;
  log: {
    debug: (msg: string, ...args: any[]) => void;
    info: (msg: string, ...args: any[]) => void;
    warn: (msg: string, ...args: any[]) => void;
    error: (msg: string, ...args: any[]) => void;
  };
  db: {
    connection: {
      raw: (sql: string, bindings?: any[]) => Promise<any>;
    };
  };
}

export type StrapiContext = {
  strapi: StrapiInterface;
  roomDocumentId: string;
  mode?: 'game' | 'debug';
};

/**
 * Creates a standardized Daicer tool with strict input/output validation.
 */
export const createDaicerTool = <
  TInput extends z.ZodObject<any, any>,
  TOutput extends z.ZodType<any, any, any> = z.ZodType<any>,
>(
  config: {
    name: string;
    description: string;
    schema: TInput;
    outputSchema?: TOutput; // Optional strict output schema validation
    func: (input: z.infer<TInput>, context: StrapiContext) => Promise<any>;
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
          } catch (validationError: any) {
            console.error(`[Tool: ${config.name}] Output validation failed:`, validationError);
            throw new Error(`Tool output validation failed: ${validationError.message}`);
          }
        }

        // Return strictly the string representation for the LLM's observation
        // The LLM expects a string.
        if (typeof result === 'string') return result;
        return JSON.stringify(result);
      } catch (error: any) {
        // Standardized error handling
        return `Error executing ${config.name}: ${error.message}`;
      }
    },
  });
};
