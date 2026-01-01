import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

/**
 * Service for generating vector embeddings using Google Gemini via LangChain.
 * Model: text-embedding-004
 */
export class EmbeddingService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private modelName = 'text-embedding-004';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: this.modelName,
      apiKey: apiKey,
    });
  }

  /**
   * Generates a vector embedding for the given text.
   * @param text The text to embed.
   * @returns A promise resolving to the embedding vector (array of numbers).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    try {
      // embedQuery is sufficient for singular text chunks or search queries
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] Failed to generate embedding:', error);
      throw error;
    }
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
