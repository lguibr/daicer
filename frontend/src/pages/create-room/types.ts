/**
 * CreateRoom Wizard Types
 */

import type { WorldSettings } from '../../types/shared';

export type WizardGroup = 'dmAndScope' | 'worldConfig' | 'characters' | 'inRoomConfig';

export interface SectionOutputs {
  section1: {
    roomId: string;
    worldHistory: string;
    conditions: unknown[];
    historyPeriods: unknown[];
  } | null;
  section2: {
    structures: unknown[];
    roads: unknown[];
    worldDescription: string;
    generatedChunks: unknown[];
    gridState?: unknown;
    terrainMap?: unknown;
  } | null;
}

export interface WorldGenSettings {
  historyDepth: number;
  eraCount: number;
  structureDensity: number;
  structureTypes: string[];
  enableRoads: boolean;
  roadQuality: 'trail' | 'path' | 'road' | 'highway' | 'medium';
  terrainComplexity: number;
}

export interface CreateRoomFormState {
  settings: WorldSettings;
  worldGenSettings: WorldGenSettings;
  currentGroup: number;
  completedGroups: Set<number>;
}
