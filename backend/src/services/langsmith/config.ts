/**
 * LangSmith Tracing Configuration
 * Section-specific metadata and tag builders for observability
 */

import type { DMStoryState } from '@daicer/shared/graph-states/dm-story-state';
import type { WorldConfigState } from '@daicer/shared/graph-states/world-config-state';
import type { CharacterState } from '@daicer/shared/graph-states/character-state';

/**
 * Build tracing config for DM Story Graph (Section 1)
 */
export function buildDMStoryTracingConfig(state: DMStoryState, userId: string) {
  return {
    metadata: {
      section: 'dm_story',
      wizard_section: 1,
      room_id: state.roomId,
      user_id: userId,
      theme: state.settings.theme,
      tone: state.settings.tone,
      history_depth: state.settings.historyDepth,
      era_count: state.settings.eraCount,
      world_type: state.settings.worldType,
      language: state.language,
    },
    tags: [
      'wizard-section-1',
      'dm-personality',
      'history-generation',
      `room:${state.roomId}`,
      `user:${userId}`,
      `depth-${state.settings.historyDepth}`,
      `eras-${state.settings.eraCount}`,
      `theme:${state.settings.theme.toLowerCase().replace(/\s+/g, '-')}`,
      `language:${state.language}`,
    ],
  };
}

/**
 * Build tracing config for World Config Graph (Section 2)
 */
export function buildWorldConfigTracingConfig(state: WorldConfigState, userId: string) {
  const structureCount = state.historyPeriods.flatMap((p) => p.structures).length;

  return {
    metadata: {
      section: 'world_config',
      wizard_section: 2,
      room_id: state.roomId,
      user_id: userId,
      structure_density: state.settings.structureDensity,
      structure_count: structureCount,
      enable_roads: state.settings.enableRoads,
      terrain_complexity: state.settings.terrainComplexity,
      depends_on_section_1: true,
    },
    tags: [
      'wizard-section-2',
      'world-configuration',
      'terrain-generation',
      `room:${state.roomId}`,
      `user:${userId}`,
      `structures-${structureCount}`,
      `roads-${state.settings.enableRoads ? 'enabled' : 'disabled'}`,
      `complexity-${state.settings.terrainComplexity}`,
    ],
  };
}

/**
 * Build tracing config for Character Setup Graph (Section 3)
 */
export function buildCharacterTracingConfig(state: CharacterState, userId: string) {
  return {
    metadata: {
      section: 'character_setup',
      wizard_section: 3,
      room_id: state.roomId,
      user_id: userId,
      player_id: state.playerId,
      character_name: state.character.name,
      character_class: state.character.characterClass,
      character_level: state.character.level,
      depends_on_sections: '1,2',
    },
    tags: [
      'wizard-section-3',
      'character-setup',
      `room:${state.roomId}`,
      `user:${userId}`,
      `player:${state.playerId}`,
      `class:${state.character.characterClass.toLowerCase()}`,
      `level-${state.character.level}`,
      `character:${state.character.name}`,
    ],
  };
}
