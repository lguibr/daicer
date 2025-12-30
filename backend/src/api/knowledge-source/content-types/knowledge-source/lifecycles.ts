import { embeddingService } from '../../../../services/embedding-service';
import { chunkMarkdown } from '@daicer/shared';

export default {
  async afterDelete(event: any) {
    const { result } = event;
    if (result && result.id) {
      console.log(`[KnowledgeSource] Deleting snippets for source ID: ${result.id}...`);
      await strapi.db.query('api::knowledge-snippet.knowledge-snippet').deleteMany({
        where: { source: result.id },
      });
      console.log(`[KnowledgeSource] Cascade delete complete for source ID: ${result.id}`);
    }
  },

  async afterCreate(event: any) {
    const { result } = event;
    if (result.content && result.id) {
      await syncKnowledgeSource(result.id, result.content, result.name);
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;
    if (result.content && result.id) {
      await syncKnowledgeSource(result.id, result.content, result.name);
    }
  },
};

async function syncKnowledgeSource(sourceId: number, content: string, sourceName: string) {
  try {
    console.log(`[KnowledgeSource] Processing source ${sourceName} (ID: ${sourceId})...`);

    // 1. Chunk Markdown
    const chunks = chunkMarkdown(content);
    console.log(`[KnowledgeSource] Generated ${chunks.length} chunks.`);

    // 2. Delete existing snippets for this source (Wipe & Replace strategy)
    await strapi.db.query('api::knowledge-snippet.knowledge-snippet').deleteMany({
      where: { source: sourceId },
    });

    // 3. Generate Embeddings & Create Snippets
    console.log(`[KnowledgeSource] Starting parallel embedding generation for ${chunks.length} chunks...`);

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
            console.log(`[KnowledgeSource] Progress: ${percent}% (${processedCount}/${totalChunks} chunks)`);
          }
        } catch (err) {
          console.error(`[KnowledgeSource] Failed to process chunk: ${chunk.title}`, err);
        }
      });
    });

    await Promise.all(tasks);

    console.log(`[KnowledgeSource] Successfully synced ${processedCount} snippets for source ${sourceName}.`);
  } catch (error: any) {
    console.error('[KnowledgeSource] Sync failed:', error);
  }
}
