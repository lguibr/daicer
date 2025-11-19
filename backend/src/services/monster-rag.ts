/**
 * Monster RAG (Retrieval Augmented Generation) Service
 * Provides semantic search over D&D 5e monsters using embeddings
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../utils/logger.js';
import { getMonsters } from './game-data.js';
import type { MonsterDocument } from '../types/game-data.js';

// ============================================================================
// Types
// ============================================================================

export interface MonsterEmbedding {
  id: string;
  name: string;
  size: string;
  type: string;
  challenge: string;
  searchableContent: string;
  embedding: number[];
}

export interface MonsterSearchResult {
  monster: MonsterDocument;
  similarity: number;
}

// ============================================================================
// Cache
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const monsterEmbeddingsCache = new Map<string, CacheEntry<MonsterEmbedding[]>>();

function getCached<T>(key: string): T | null {
  const entry = monsterEmbeddingsCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    monsterEmbeddingsCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  monsterEmbeddingsCache.set(key, { data, timestamp: Date.now() } as CacheEntry<any>);
}

// ============================================================================
// Similarity Calculation
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
    if (a !== undefined && b !== undefined) {
      dotProduct += a * b;
      magnitudeA += a * a;
      magnitudeB += b * b;
    }
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

/**
 * Build searchable content from monster data
 */
function buildSearchableContent(monster: MonsterDocument): string {
  const parts: string[] = [
    `Name: ${monster.name}`,
    `Type: ${monster.type}`,
    `Size: ${monster.size}`,
    `Alignment: ${monster.alignment}`,
    `Challenge: ${monster.challenge}`,
  ];

  // Add special abilities
  if (monster.specialAbilities && monster.specialAbilities.length > 0) {
    parts.push('Special Abilities:');
    monster.specialAbilities.forEach((ability) => {
      parts.push(`- ${ability.name}: ${ability.description}`);
    });
  }

  // Add actions
  if (monster.actions && monster.actions.length > 0) {
    parts.push('Actions:');
    monster.actions.forEach((action) => {
      parts.push(`- ${action.name}: ${action.description}`);
    });
  }

  // Add legendary actions
  if (monster.legendaryActions && monster.legendaryActions.length > 0) {
    parts.push('Legendary Actions:');
    monster.legendaryActions.forEach((action) => {
      parts.push(`- ${action.name}: ${action.description}`);
    });
  }

  return parts.join('\n');
}

/**
 * Generate embeddings for all monsters (cached)
 */
async function getMonsterEmbeddings(): Promise<MonsterEmbedding[]> {
  const cacheKey = 'all_monster_embeddings';
  const cached = getCached<MonsterEmbedding[]>(cacheKey);
  if (cached) {
    return cached;
  }

  logger.info('Generating embeddings for monsters...');

  const monsters = await getMonsters();
  const embeddings = getEmbeddingsInstance();

  // Build searchable content for each monster
  const searchableContents = monsters.map((monster) => ({
    monster,
    content: buildSearchableContent(monster),
  }));

  // Generate embeddings in batch
  const contents = searchableContents.map((item) => item.content);
  const vectors = await embeddings.embedDocuments(contents);

  // Combine monsters with their embeddings
  const monsterEmbeddings: MonsterEmbedding[] = searchableContents
    .map((item, index) => ({
      id: item.monster.id,
      name: item.monster.name,
      size: item.monster.size,
      type: item.monster.type,
      challenge: item.monster.challenge,
      searchableContent: item.content,
      embedding: vectors[index],
    }))
    .filter((item): item is MonsterEmbedding => item.embedding !== undefined);

  setCache(cacheKey, monsterEmbeddings);
  logger.info(`Generated embeddings for ${monsterEmbeddings.length} monsters`);

  return monsterEmbeddings;
}

// ============================================================================
// Semantic Search
// ============================================================================

/**
 * Search monsters by semantic similarity
 * @param query - Natural language query (e.g., "flying fire-breathing creatures")
 * @param limit - Maximum number of results to return
 * @param challengeFilter - Optional CR filter (e.g., "1/2", "5", "20")
 * @returns Top-k most relevant monsters with similarity scores
 */
export async function searchMonsters(
  query: string,
  limit: number = 5,
  challengeFilter?: string
): Promise<MonsterSearchResult[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await embedQuery(query);

    // Get monster embeddings
    const monsterEmbeddings = await getMonsterEmbeddings();

    // Filter by challenge rating if specified
    let filteredEmbeddings = monsterEmbeddings;
    if (challengeFilter) {
      filteredEmbeddings = monsterEmbeddings.filter((m) => m.challenge.includes(challengeFilter));
    }

    // Get all monsters for detailed info
    const allMonsters = await getMonsters();
    const monstersMap = new Map(allMonsters.map((m) => [m.id, m]));

    // Calculate similarities
    const results: MonsterSearchResult[] = filteredEmbeddings
      .map((monsterEmbed) => {
        const monster = monstersMap.get(monsterEmbed.id);
        if (!monster) return null;

        return {
          monster,
          similarity: cosineSimilarity(queryEmbedding, monsterEmbed.embedding),
        };
      })
      .filter((result): result is MonsterSearchResult => result !== null);

    // Sort by similarity (descending) and take top-k
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);

    logger.info(
      `Monster search: "${query}" → ${topResults.length} results${challengeFilter ? ` (CR: ${challengeFilter})` : ''}`
    );

    return topResults;
  } catch (error) {
    logger.error('Error searching monsters:', error);
    throw error;
  }
}

/**
 * Get monster context for LLM
 * Formats search results as a string for injection into prompts
 */
export async function getMonsterContext(query: string, limit: number = 3, challengeFilter?: string): Promise<string> {
  const results = await searchMonsters(query, limit, challengeFilter);

  if (results.length === 0) {
    return 'No relevant monsters found.';
  }

  const contextParts = results.map((result, index) => {
    const { monster, similarity } = result;

    const abilities = monster.specialAbilities
      ? monster.specialAbilities.map((a) => `  - ${a.name}: ${a.description}`).join('\n')
      : '  None';

    const actions = monster.actions.map((a) => `  - ${a.name}: ${a.description}`).join('\n');

    const legendary = monster.legendaryActions
      ? `\n\nLegendary Actions:\n${monster.legendaryActions.map((a) => `  - ${a.name}: ${a.description}`).join('\n')}`
      : '';

    return `
**Monster ${index + 1}: ${monster.name}** (relevance: ${(similarity * 100).toFixed(1)}%)
Type: ${monster.type} | Size: ${monster.size} | Alignment: ${monster.alignment}
Challenge: ${monster.challenge} | AC: ${monster.armorClass} | HP: ${monster.hitPoints}
Speed: ${monster.speed}

Ability Scores: STR ${monster.abilityScores.STR}, DEX ${monster.abilityScores.DEX}, CON ${monster.abilityScores.CON}, INT ${monster.abilityScores.INT}, WIS ${monster.abilityScores.WIS}, CHA ${monster.abilityScores.CHA}

Special Abilities:
${abilities}

Actions:
${actions}${legendary}
`.trim();
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Clear monster embeddings cache
 */
export function clearMonsterCache(): void {
  monsterEmbeddingsCache.clear();
  logger.info('Monster embeddings cache cleared');
}
