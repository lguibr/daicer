import { embeddingService } from '../../../../services/embedding-service';
import { chunkMarkdown } from '@daicer/shared';

export default {
  async afterDelete(event: { result: { id: number } }) {
    const { result } = event;
    if (result && result.id) {
      strapi.log.info(`[KnowledgeSource] Deleting snippets for source ID: ${result.id}...`);
      await strapi.db.query('api::knowledge-snippet.knowledge-snippet').deleteMany({
        where: { source: result.id },
      });
      strapi.log.info(`[KnowledgeSource] Cascade delete complete for source ID: ${result.id}`);
    }
  },

  async afterCreate(event: { result: { id: number; content?: string; name: string } }) {
    const { result } = event;
    if (result.content && result.id) {
      await syncKnowledgeSource(result.id, result.content, result.name);
    }
  },

  async afterUpdate(event: { result: { id: number; content?: string; name: string } }) {
    const { result } = event;
    if (result.content && result.id) {
      await syncKnowledgeSource(result.id, result.content, result.name);
    }
  },
};

async function syncKnowledgeSource(sourceId: number, content: string, sourceName: string) {
  try {
    strapi.log.info(`[KnowledgeSource] Processing source ${sourceName} (ID: ${sourceId})...`);

    // 1. Chunk Markdown
    const chunks = chunkMarkdown(content);
    strapi.log.info(`[KnowledgeSource] Generated ${chunks.length} chunks.`);

    // 2. Delete existing snippets for this source (Wipe & Replace strategy)
    await strapi.db.query('api::knowledge-snippet.knowledge-snippet').deleteMany({
      where: { source: sourceId },
    });

    // 3. Generate Embeddings & Create Snippets
    strapi.log.info(`[KnowledgeSource] Starting parallel embedding generation for ${chunks.length} chunks...`);

    // Concurrency limit: 5 to be safe with API rate limits
    const limit = (await import('p-limit')).default(5);

    let processedCount = 0;
    const totalChunks = chunks.length;

    const tasks = chunks.map((chunk) => {
      return limit(async () => {
        // Skip generic/short chunks
        if (chunk.content.length < 10) return;

        try {
          const embedding = await embeddingService.generateEmbedding(chunk.content);

          await strapi.entityService.create('api::knowledge-snippet.knowledge-snippet', {
            data: {
              title: chunk.title,
              content: chunk.content,
              source: sourceId,
              embedding: embedding, // Stored as JSON, used as vector
            },
          });

          processedCount++;

          // Log progress every 10% or 10 chunks
          if (processedCount % 10 === 0 || processedCount === totalChunks) {
            const percent = Math.round((processedCount / totalChunks) * 100);
            strapi.log.info(`[KnowledgeSource] Progress: ${percent}% (${processedCount}/${totalChunks} chunks)`);
          }
        } catch (err: unknown) {
          strapi.log.error(`[KnowledgeSource] Failed to process chunk: ${chunk.title}`, err);
        }
      });
    });

    await Promise.all(tasks);

    strapi.log.info(`[KnowledgeSource] Successfully synced ${processedCount} snippets for source ${sourceName}.`);
  } catch (error: unknown) {
    strapi.log.error('[KnowledgeSource] Sync failed:', error);
  }
}
