import { z } from 'zod';
import { createDaicerTool, StrapiContext } from './tool-factory';

export const retrieveKnowledgeTool = (context: StrapiContext) =>
  createDaicerTool(
    {
      name: 'retrieve_knowledge',
      description:
        'Retrieves verified D&D rules, lore, and documentation snippets relevant to a query. Use this to check official rules.',
      schema: z.object({
        query: z.string().describe('The search query for the rules or knowledge needed.'),
      }),
      outputSchema: z.string(), // Strict output: markdown string
      func: async ({ query }, { strapi }) => {
        try {
          if (!strapi) {
            return 'Error: Database connection not available.';
          }

          // Use require or import. Assuming this service exists.
          // Correct relative path: src/ai/tools -> src/services
          const { embeddingService } = require('../../services/embedding-service');

          const queryEmbedding = await embeddingService.generateEmbedding(query);

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

          const rows = results.rows || results;

          if (!rows || rows.length === 0) {
            return 'No relevant knowledge found.';
          }

          return rows.map((row: any) => `### ${row.title}\n${row.content}\n`).join('\n---\n');
        } catch (error: any) {
          console.error('Knowledge retrieval failed:', error);
          return 'Error retrieving knowledge.';
        }
      },
    },
    context
  );
