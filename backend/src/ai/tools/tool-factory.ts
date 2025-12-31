import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Standardized Tool Result Interface
export interface ToolResult {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; // The structured data returned
  display: string; // The human-readable string for the LLM
}

// Undefine 'any' for Strapi by defining a minimal interface we actually use
export interface StrapiService {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // fallback for services we don't fully type yet, but we should try to restrict
}

export interface StrapiDocumentService {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  findOne: (params: any) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (params: any) => Promise<any[]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (params: any) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (params: any) => Promise<any>;
  // ... add more as needed
}

export interface StrapiInterface {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  service(uid: string): any; // Ideally typed, but service lookups are dynamic in Strapi
  documents(uid: string): StrapiDocumentService;
  log: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: (msg: string, ...args: any[]) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (msg: string, ...args: any[]) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (msg: string, ...args: any[]) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (msg: string, ...args: any[]) => void;
  };
  db: {
    connection: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  TOutput extends z.ZodType<any, any, any> = z.ZodType<any>,
>(
  config: {
    name: string;
    description: string;
    schema: TInput;
    outputSchema?: TOutput; // Optional strict output schema validation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (validationError: any) {
            console.error(`[Tool: ${config.name}] Output validation failed:`, validationError);
            throw new Error(`Tool output validation failed: ${validationError.message}`);
          }
        }

        // Return strictly the string representation for the LLM's observation
        // The LLM expects a string.
        if (typeof result === 'string') return result;
        return JSON.stringify(result);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Standardized error handling
        return `Error executing ${config.name}: ${error.message}`;
      }
    },
  });
};
