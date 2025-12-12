/**
 * State Merger Utilities
 * Merge validated section outputs into unified game state
 */

import { z } from 'zod';
import { DMStoryOutputSchema, type DMStoryOutput } from './dm-story-state';
import { WorldConfigOutputSchema, type WorldConfigOutput } from './world-config-state';
import { CharacterOutputSchema, type CharacterOutput } from './character-state';

/**
 * Validate Section 1 dependencies before Section 2 can run
 * @throws Error if required Section 1 fields missing or invalid
 */
export function validateSection1Dependencies(input: unknown): void {
  const data = input as any;

  if (!data.historyPeriods || !Array.isArray(data.historyPeriods) || data.historyPeriods.length === 0) {
    throw new Error('Missing historyPeriods from Section 1. Section 1 must complete before Section 2.');
  }

  if (!data.conditions || !Array.isArray(data.conditions) || data.conditions.length !== 5) {
    throw new Error('Missing or invalid conditions from Section 1. Expected exactly 5 conditions.');
  }

  if (!data.worldHistory || typeof data.worldHistory !== 'string' || data.worldHistory.trim().length === 0) {
    throw new Error('Missing worldHistory from Section 1. Section 1 must complete before Section 2.');
  }
}

/**
 * Validate Section 2 dependencies before Section 3 can run
 * @throws Error if required Section 2 fields missing or invalid
 */
export function validateSection2Dependencies(input: unknown): void {
  const data = input as any;

  if (
    !data.worldDescription ||
    typeof data.worldDescription !== 'string' ||
    data.worldDescription.trim().length === 0
  ) {
    throw new Error('Missing worldDescription from Section 2. Section 2 must complete before Section 3.');
  }
}

/**
 * Merge validated section outputs into unified game state
 *
 * @param dmStory - Validated output from Section 1 (DM Story graph)
 * @param worldConfig - Validated output from Section 2 (World Config graph)
 * @param characters - Array of validated outputs from Section 3 (Character Setup graphs, one per player)
 * @returns Merged game state ready for Firestore persistence
 *
 * @throws {z.ZodError} If any input fails validation
 * @throws {Error} If duplicate player IDs found
 *
 * @example
 * ```typescript
 * const merged = mergeSectionOutputs(
 *   section1Result,
 *   section2Result,
 *   [player1Result, player2Result]
 * );
 * // merged.players.length === 2
 * ```
 */
export function mergeSectionOutputs(
  dmStory: DMStoryOutput,
  worldConfig: WorldConfigOutput,
  characters: CharacterOutput[]
): {
  roomId: string;
  worldHistory: string;
  worldConditions: z.infer<typeof DMStoryOutputSchema>['conditions'];
  historyPeriods: z.infer<typeof DMStoryOutputSchema>['historyPeriods'];
  worldDescription: string;
  structures: z.infer<typeof WorldConfigOutputSchema>['structures'];
  roads: z.infer<typeof WorldConfigOutputSchema>['roads'];
  terrainMap?: any;
  generatedChunks: any[];
  gridState?: any;
  players: Array<{
    id: string;
    userId: string;
    name: string;
    character: any;
    openingNarrative: string;
    isReady: boolean;
    action: null;
    joinedAt: number;
  }>;
} {
  // Validate all inputs before merging
  const validatedDMStory = DMStoryOutputSchema.parse(dmStory);
  const validatedWorldConfig = WorldConfigOutputSchema.parse(worldConfig);
  const validatedCharacters = characters.map((c, index) => {
    try {
      return CharacterOutputSchema.parse(c);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Character ${index} validation failed: ${error.message}`);
      }
      throw error;
    }
  });

  // Check for duplicate player IDs
  const playerIds = new Set<string>();
  for (const char of validatedCharacters) {
    if (playerIds.has(char.playerId)) {
      throw new Error(`Duplicate player ID found: ${char.playerId}`);
    }
    playerIds.add(char.playerId);
  }

  // Merge into unified state
  const mergedState = {
    // Metadata (from Section 1)
    roomId: validatedDMStory.roomId,

    // From Section 1
    worldHistory: validatedDMStory.worldHistory,
    worldConditions: validatedDMStory.conditions,
    historyPeriods: validatedDMStory.historyPeriods,

    // From Section 2
    worldDescription: validatedWorldConfig.worldDescription,
    structures: validatedWorldConfig.structures,
    roads: validatedWorldConfig.roads,
    terrainMap: validatedWorldConfig.terrainMap,
    generatedChunks: validatedWorldConfig.generatedChunks,
    gridState: validatedWorldConfig.gridState,

    // From Section 3 (multiple players)
    players: validatedCharacters.map((c, index) => ({
      id: c.playerId,
      userId: c.playerId, // Assume userId === playerId
      name: c.character.name,
      character: c.character,
      openingNarrative: c.openingNarrative,
      isReady: false,
      action: null,
      joinedAt: Date.now() + index, // Slight offset for uniqueness
    })),
  };

  return mergedState;
}
