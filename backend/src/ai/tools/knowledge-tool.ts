import { z } from 'zod';
import { tool } from '@langchain/core/tools';

/**
 * Tool for retrieving knowledge from the D&D rules and verified documents.
 */
export const retrieveKnowledgeTool = tool(
  async ({ query }: { query: string }) => {
    try {
      if (!strapi) {
        return 'Error: Database connection not available.';
      }

      const { embeddingService } = require('../../services/embedding-service');
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Raw SQL query for vector similarity (using pgvector operator <=>)
      // We cast the JSON embedding field to vector type
      const results = await strapi.db.connection.raw(
        `
        SELECT 
          title, 
          content, 
          1 - (embedding::vector <=> ?::vector) as similarity
        FROM knowledge_snippets 
        ORDER BY similarity DESC
        LIMIT 5
        `,
        [JSON.stringify(queryEmbedding)]
      );

      // Handle raw result structure (knex returns { rows: [] })
      const rows = results.rows || results;

      if (!rows || rows.length === 0) {
        return 'No relevant knowledge found.';
      }

      return rows.map((row: any) => `### ${row.title}\n${row.content}\n`).join('\n---\n');
    } catch (error) {
      console.error('Knowledge retrieval failed:', error);
      return 'Error retrieving knowledge.';
    }
  },
  {
    name: 'retrieve_knowledge',
    description:
      'Retrieves verified D&D rules, lore, and documentation snippets relevant to a query. Use this to check official rules.',
    schema: z.object({
      query: z.string().describe('The search query for the rules or knowledge needed.'),
    }),
  } as any // Cast to any to avoid "excessively deep" type error with complex Zod/Tool types
) as unknown as import('@langchain/core/tools').StructuredTool;
