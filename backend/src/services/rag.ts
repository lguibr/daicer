/**
 * RAG (Retrieval Augmented Generation) Service
 * Provides semantic search over D&D 5e SRD rules using Firestore Vector Search
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

const SRD_RULES_COLLECTION = 'srd_rules';

// ============================================================================
// Types
// ============================================================================

export interface SRDRule {
  id: string;
  title: string;
  category: 'combat' | 'spells' | 'exploration' | 'conditions' | 'abilities' | 'general';
  content: string;
  tags: string[];
  embedding: number[];
  createdAt: number;
}

export interface SRDRuleSearchResult {
  rule: SRDRule;
  similarity: number;
}

// ============================================================================
// Cache Layer
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache recent query results only (not all rules)
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const queryCache = new Map<string, CacheEntry<SRDRuleSearchResult[]>>();

function getCachedQuery(key: string): SRDRuleSearchResult[] | null {
  const entry = queryCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    queryCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCacheQuery(key: string, data: SRDRuleSearchResult[]): void {
  queryCache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// Embeddings
// ============================================================================

let embeddingsInstance: OpenAIEmbeddings | null = null;

function getEmbeddingsInstance(): OpenAIEmbeddings {
  if (!embeddingsInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    embeddingsInstance = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });
  }

  return embeddingsInstance;
}

/**
 * Generate embedding for a query
 */
async function embedQuery(query: string): Promise<number[]> {
  const embeddings = getEmbeddingsInstance();
  const vector = await embeddings.embedQuery(query);
  return vector;
}

// ============================================================================
// Semantic Search (Firestore Vector Search)
// ============================================================================

/**
 * Search rules by semantic similarity using Firestore Vector Search
 * @param query - Natural language query
 * @param limit - Maximum number of results to return
 * @param category - Optional category filter
 * @returns Top-k most relevant rules with similarity scores
 */
export async function searchRules(query: string, limit: number = 3, category?: string): Promise<SRDRuleSearchResult[]> {
  try {
    // Check cache
    const cacheKey = `${query}:${limit}:${category || 'all'}`;
    const cached = getCachedQuery(cacheKey);
    if (cached) {
      logger.info(`RAG search (cached): "${query}" → ${cached.length} results`);
      return cached;
    }

    // Generate query embedding
    const queryEmbedding = await embedQuery(query);

    // Use Firestore native vector search
    const vectorQuery = db()
      .collection(SRD_RULES_COLLECTION)
      .findNearest('embedding', FieldValue.vector(queryEmbedding), {
        limit,
        distanceMeasure: 'COSINE',
      });

    // Apply category filter if specified
    // Note: VectorQuery doesn't support .where() in current version
    // Category filtering will be done post-query
    // if (category) {
    //   vectorQuery = vectorQuery.where('category', '==', category);
    // }

    const snapshot = await vectorQuery.get();

    let results: SRDRuleSearchResult[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        rule: data as SRDRule,
        // Convert distance to similarity (cosine distance is 1 - similarity)
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
        similarity: 1 - ((data as any).__distance__ || 0),
      };
    });

    // Filter by category if specified (post-query filtering)
    if (category) {
      results = results.filter((result) => result.rule.category === category);
    }

    logger.info(`RAG search: "${query}" → ${results.length} results (category: ${category || 'all'})`);

    // Cache results
    setCacheQuery(cacheKey, results);

    return results;
  } catch (error) {
    logger.error('Error searching rules:', error);
    throw error;
  }
}

/**
 * Get rule context for LLM
 * Formats search results as a string for injection into prompts
 */
export async function getRuleContext(query: string, limit: number = 3, category?: string): Promise<string> {
  const results = await searchRules(query, limit, category);

  if (results.length === 0) {
    return 'No relevant rules found.';
  }

  const contextParts = results.map((result, index) => {
    const { rule, similarity } = result;
    return `
**Rule ${index + 1}: ${rule.title}** (relevance: ${(similarity * 100).toFixed(1)}%)
Category: ${rule.category}
${rule.content}
`.trim();
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Search rules by tags
 */
export async function searchRulesByTags(tags: string[], limit: number = 5): Promise<SRDRule[]> {
  const snapshot = await db()
    .collection(SRD_RULES_COLLECTION)
    .where('tags', 'array-contains-any', tags.slice(0, 10)) // Firestore limit: max 10 values
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as SRDRule);
}

/**
 * Clear query cache
 */
export function clearRulesCache(): void {
  queryCache.clear();
  logger.info('RAG query cache cleared');
}
