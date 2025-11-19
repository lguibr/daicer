/**
 * Section Cache Utility
 * Manages localStorage caching for section graph outputs
 * Enables page refresh recovery and backward navigation
 */

import type { HistoricalPeriod, WorldCondition, Structure, Road } from '@daicer/shared';
import type { CharacterSheet } from '@daicer/shared/character';

const CACHE_KEYS = {
  section1: (roomId: string) => `daice-graph-section-1-${roomId}`,
  section2: (roomId: string) => `daice-graph-section-2-${roomId}`,
  section3: (roomId: string, playerId: string) => `daice-graph-section-3-${roomId}-${playerId}`,
  section3Prefix: (roomId: string) => `daice-graph-section-3-${roomId}-`,
};

/**
 * Section 1 Output Type
 */
export interface Section1Output {
  roomId: string;
  worldHistory: string;
  conditions: WorldCondition[];
  historyPeriods: HistoricalPeriod[];
}

/**
 * Section 2 Output Type
 */
export interface Section2Output {
  structures: Structure[];
  roads: Road[];
  worldDescription: string;
  generatedChunks: unknown[];
  gridState?: unknown;
  terrainMap?: unknown;
}

/**
 * Section 3 Output Type (per-player)
 */
export interface Section3Output {
  playerId: string;
  openingNarrative: string;
  character: CharacterSheet;
}

/**
 * Cache Section 1 output to localStorage
 * NO-OP: Caching disabled to avoid quota issues. Data persists in Firestore.
 */
export function cacheSection1Output(roomId: string, output: Section1Output): void {
  // No-op - caching disabled
}

/**
 * Get cached Section 1 output from localStorage
 */
export function getSection1Output(roomId: string): Section1Output | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.section1(roomId));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('[SectionCache] Failed to read Section 1 cache:', error);
    return null;
  }
}

/**
 * Cache Section 2 output to localStorage
 * NO-OP: Caching disabled to avoid quota issues. Data persists in Firestore.
 */
export function cacheSection2Output(roomId: string, output: Section2Output): void {
  // No-op - caching disabled
}

/**
 * Get cached Section 2 output from localStorage
 */
export function getSection2Output(roomId: string): Section2Output | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.section2(roomId));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('[SectionCache] Failed to read Section 2 cache:', error);
    return null;
  }
}

/**
 * Cache Section 3 output for a specific player
 */
export function cacheSection3Output(roomId: string, playerId: string, output: Section3Output): void {
  try {
    localStorage.setItem(CACHE_KEYS.section3(roomId, playerId), JSON.stringify(output));
  } catch (error) {
    console.error('[SectionCache] Failed to cache Section 3:', error);
  }
}

/**
 * Get cached Section 3 output for a specific player
 */
export function getSection3Output(roomId: string, playerId: string): Section3Output | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.section3(roomId, playerId));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('[SectionCache] Failed to read Section 3 cache:', error);
    return null;
  }
}

/**
 * Get all Section 3 outputs for a room (all players)
 */
export function getAllSection3Outputs(roomId: string): Section3Output[] {
  try {
    const prefix = CACHE_KEYS.section3Prefix(roomId);
    const outputs: Section3Output[] = [];

    // Iterate localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          outputs.push(JSON.parse(cached));
        }
      }
    }

    return outputs;
  } catch (error) {
    console.error('[SectionCache] Failed to read all Section 3 cache:', error);
    return [];
  }
}

/**
 * Clear all section caches for a room
 * Used when invalidating due to backward navigation
 */
export function clearSectionCache(roomId: string): void {
  try {
    // Clear Section 1
    localStorage.removeItem(CACHE_KEYS.section1(roomId));

    // Clear Section 2
    localStorage.removeItem(CACHE_KEYS.section2(roomId));

    // Clear all Section 3 entries for this room
    const prefix = CACHE_KEYS.section3Prefix(roomId);
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(`[SectionCache] Cleared all caches for room ${roomId}`);
  } catch (error) {
    console.error('[SectionCache] Failed to clear cache:', error);
  }
}

/**
 * Clear Section 2 and 3 (used when Section 1 changes invalidate later sections)
 * NO-OP: Caching disabled.
 */
export function clearSection2And3Cache(roomId: string): void {
  // No-op - caching disabled
}

/**
 * Clear only Section 3 cache (used when Section 2 changes)
 */
export function clearSection3Cache(roomId: string): void {
  try {
    const prefix = CACHE_KEYS.section3Prefix(roomId);
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(`[SectionCache] Cleared Section 3 cache for room ${roomId}`);
  } catch (error) {
    console.error('[SectionCache] Failed to clear Section 3 cache:', error);
  }
}
