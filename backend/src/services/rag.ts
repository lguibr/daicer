/**
 * RAG (Retrieval Augmented Generation) Service
 * Provides semantic search over D&D 5e SRD rules using embeddings
 */

import { OpenAIEmbeddings } from '@langchain/openai';
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

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const rulesCache = new Map<string, CacheEntry<SRDRule[]>>();

function getCached<T>(key: string): T | null {
  const entry = rulesCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    rulesCache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache(key: string, data: SRDRule[]): void {
  rulesCache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// Vector Math
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    // eslint-disable-next-line no-continue
    if (a === undefined || b === undefined) continue;

    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
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
// Rule Retrieval
// ============================================================================

/**
 * Get all rules from Firestore (cached)
 */
async function getAllRules(): Promise<SRDRule[]> {
  const cacheKey = 'all_rules';
  const cached = getCached<SRDRule[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const snapshot = await db().collection(SRD_RULES_COLLECTION).get();
  const rules = snapshot.docs.map((doc) => doc.data() as SRDRule);

  setCache(cacheKey, rules);
  return rules;
}

/**
 * Get rules by category (cached)
 */
async function getRulesByCategory(category: string): Promise<SRDRule[]> {
  const cacheKey = `category:${category}`;
  const cached = getCached<SRDRule[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const snapshot = await db().collection(SRD_RULES_COLLECTION).where('category', '==', category).get();

  const rules = snapshot.docs.map((doc) => doc.data() as SRDRule);
  setCache(cacheKey, rules);
  return rules;
}

// ============================================================================
// Semantic Search
// ============================================================================

/**
 * Search rules by semantic similarity
 * @param query - Natural language query
 * @param limit - Maximum number of results to return
 * @param category - Optional category filter
 * @returns Top-k most relevant rules with similarity scores
 */
export async function searchRules(query: string, limit: number = 3, category?: string): Promise<SRDRuleSearchResult[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await embedQuery(query);

    // Get rules (filtered by category if specified)
    const rules = category ? await getRulesByCategory(category) : await getAllRules();

    // Calculate similarities
    const results: SRDRuleSearchResult[] = rules.map((rule) => ({
      rule,
      similarity: cosineSimilarity(queryEmbedding, rule.embedding),
    }));

    // Sort by similarity (descending) and take top-k
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);

    logger.info(`RAG search: "${query}" → ${topResults.length} results (category: ${category || 'all'})`);

    return topResults;
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
  const allRules = await getAllRules();

  const scoredRules = allRules.map((rule) => {
    const matchCount = tags.filter((tag) => rule.tags.includes(tag)).length;
    return { rule, score: matchCount };
  });

  scoredRules.sort((a, b) => b.score - a.score);
  return scoredRules
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => item.rule);
}

/**
 * Clear rules cache
 */
export function clearRulesCache(): void {
  rulesCache.clear();
  logger.info('RAG rules cache cleared');
}
