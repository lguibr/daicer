/**
 * LangSmith tracing utilities
 * Provides helpers for adding comprehensive tracing with tags and metadata
 */

import type { Room, WorldSettings, Player, GamePhase, Language, CharacterSheet, Creature } from '@/types/index';
import type { CharacterCreationState, GameplayState, CombatState } from '@/graph/state';

/**
 * Trace metadata structure for LangSmith
 * Contains all cardinality for filtering and analysis
 */
export interface TraceMetadata {
  // Thread identification (session_id and thread_id for LangSmith grouping)
  thread_id: string;
  session_id: string;
  conversation_id: string;

  // Room identification
  room_id: string;
  room_code: string;
  owner_id: string;

  // Game phase
  phase: GamePhase;

  // World settings (when available)
  world_theme?: string;
  world_setting?: string;
  world_tone?: string;
  world_type?: string;
  world_size?: string;
  world_background?: string;

  // Game configuration
  difficulty?: string;
  adventure_length?: string;
  starting_level?: number;
  language: Language;

  // Player information
  player_count: number;
  player_ids?: string[];
  player_names?: string[];
  player_user_ids?: string[];

  // Character information
  character_ids?: string[];
  character_names?: string[];
  character_classes?: string[];
  character_races?: string[];
  character_levels?: number[];

  // Turn/round tracking
  turn_number?: number;
  combat_round?: number;

  // Action tracking
  pending_actions_count?: number;
  active_creatures_count?: number;

  // DM Style
  dm_verbosity?: number;
  dm_detail?: number;
  dm_engagement?: number;
  dm_narrative?: number;
  dm_special_mode?: string;

  // Timestamps
  game_timestamp: number;
  created_at: number;
  updated_at: number;
}

/**
 * Build tracing configuration from room and game state
 * Generates comprehensive metadata and tags for LangSmith filtering
 */
export function buildTracingConfig(params: {
  room: Pick<Room, 'id' | 'code' | 'ownerId' | 'phase' | 'createdAt' | 'updatedAt'> & {
    settings: WorldSettings | Partial<WorldSettings> | null;
    worldDescription: string;
  };
  players?: Partial<Player>[] | Player[];
  phase?: GamePhase;
  turnNumber?: number;
  combatRound?: number;
  creatures?: Creature[];
  additionalTags?: string[];
  additionalMetadata?: Record<string, unknown>;
}): { metadata: TraceMetadata; tags: string[] } {
  const {
    room,
    players = [],
    phase,
    turnNumber,
    combatRound,
    creatures = [],
    additionalTags = [],
    additionalMetadata = {},
  } = params;

  const { settings } = room;
  const currentPhase = phase || room.phase;
  const language = settings?.language || 'en';

  // Build comprehensive metadata
  const metadata: TraceMetadata = {
    // Thread identification - use room.id as the thread for all traces in this room
    thread_id: room.id,
    session_id: room.id,
    conversation_id: room.id,

    // Room identification
    room_id: room.id,
    room_code: room.code,
    owner_id: room.ownerId,

    // Game phase
    phase: currentPhase,

    // World settings
    ...(settings && {
      ...(settings.theme && { world_theme: settings.theme }),
      ...(settings.setting && { world_setting: settings.setting }),
      ...(settings.tone && { world_tone: settings.tone }),
      ...('worldType' in settings && settings.worldType && { world_type: settings.worldType }),
      ...('worldSize' in settings && settings.worldSize && { world_size: settings.worldSize }),
      ...('worldBackground' in settings && settings.worldBackground && { world_background: settings.worldBackground }),
      ...(settings.difficulty && { difficulty: settings.difficulty }),
      ...(settings.adventureLength && { adventure_length: settings.adventureLength }),
      ...(settings.startingLevel !== undefined && { starting_level: settings.startingLevel }),
    }),

    // Language
    language,

    // Player information
    player_count: players.length,
    ...(players.length > 0 && {
      player_ids: players.map((p) => p.id).filter((id): id is string => id !== undefined),
      player_names: players.map((p) => p.name).filter((name): name is string => name !== undefined),
      player_user_ids: players.map((p) => p.userId).filter((id): id is string => id !== undefined),
      character_names: players.map((p) => p.character?.name).filter((name): name is string => name !== undefined),
      character_classes: players.map((p) => p.character?.characterClass).filter((c): c is string => c !== undefined),
      character_races: players.map((p) => p.character?.race).filter((r): r is string => r !== undefined),
      character_levels: players.map((p) => p.character?.level).filter((l): l is number => l !== undefined),
    }),

    // Turn/round tracking
    ...(turnNumber !== undefined && { turn_number: turnNumber }),
    ...(combatRound !== undefined && { combat_round: combatRound }),

    // Action tracking
    ...(players.length > 0 && {
      pending_actions_count: players.filter((p) => p.action !== null).length,
    }),
    ...(creatures.length > 0 && {
      active_creatures_count: creatures.length,
    }),

    // DM Style
    ...(settings?.dmStyle && {
      dm_verbosity: settings.dmStyle.verbosity,
      dm_detail: settings.dmStyle.detail,
      dm_engagement: settings.dmStyle.engagement,
      dm_narrative: settings.dmStyle.narrative,
      ...(settings.dmStyle.specialMode && { dm_special_mode: settings.dmStyle.specialMode }),
    }),

    // Timestamps
    game_timestamp: Date.now(),
    created_at: room.createdAt,
    updated_at: room.updatedAt,

    // Additional metadata
    ...additionalMetadata,
  };

  // Build comprehensive tags for filtering
  const tags: string[] = [
    `room:${room.id}`,
    `room_code:${room.code}`,
    `owner:${room.ownerId}`,
    `phase:${currentPhase}`,
    `language:${language}`,
  ];

  // Add world setting tags
  if (settings) {
    const worldTags = [
      ...(settings.theme ? [`theme:${settings.theme}`] : []),
      ...(settings.setting ? [`setting:${settings.setting}`] : []),
      ...(settings.tone ? [`tone:${settings.tone}`] : []),
      ...(settings.difficulty ? [`difficulty:${settings.difficulty}`] : []),
      ...(settings.adventureLength ? [`adventure:${settings.adventureLength}`] : []),
    ];
    tags.push(...worldTags);

    // Add full WorldSettings tags if available
    if ('worldType' in settings && settings.worldType) {
      tags.push(`world_type:${settings.worldType}`);
    }
    if ('worldSize' in settings && settings.worldSize) {
      tags.push(`world_size:${settings.worldSize}`);
    }

    if (settings.dmStyle?.specialMode) {
      tags.push(`dm_mode:${settings.dmStyle.specialMode}`);
    }
  }

  // Add player tags
  if (players.length > 0) {
    tags.push(`player_count:${players.length}`);
    players.forEach((player) => {
      if (player.id) tags.push(`player:${player.id}`);
      if (player.character?.name) tags.push(`character:${player.character.name}`);
      if (player.character?.characterClass) tags.push(`class:${player.character.characterClass}`);
      if (player.character?.race) tags.push(`race:${player.character.race}`);
    });
  }

  // Add turn/round tags
  if (turnNumber !== undefined) {
    tags.push(`turn:${turnNumber}`);
  }
  if (combatRound !== undefined) {
    tags.push(`round:${combatRound}`);
  }

  // Add creature tags
  if (creatures.length > 0) {
    tags.push(`creatures:${creatures.length}`);
    creatures.forEach((creature) => {
      tags.push(`creature:${creature.name}`);
    });
  }

  // Add any additional tags
  tags.push(...additionalTags);

  return { metadata, tags };
}

/**
 * Build tracing config from CharacterCreationState
 */
export function buildTracingConfigFromCharCreation(
  state: CharacterCreationState,
  additionalTags?: string[],
  additionalMetadata?: Record<string, unknown>
): { metadata: TraceMetadata; tags: string[] } {
  return buildTracingConfig({
    room: {
      id: state.roomId,
      code: state.code,
      ownerId: state.ownerId,
      settings: state.settings,
      worldDescription: state.worldDescription,
      phase: 'CHARACTER_CREATION' as GamePhase,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    players: state.players as any,
    phase: 'CHARACTER_CREATION' as GamePhase,
    additionalTags,
    additionalMetadata,
  });
}

/**
 * Build tracing config from GameplayState
 */
export function buildTracingConfigFromGameplay(
  state: GameplayState,
  turnNumber?: number,
  additionalTags?: string[],
  additionalMetadata?: Record<string, unknown>
): { metadata: TraceMetadata; tags: string[] } {
  return buildTracingConfig({
    room: {
      id: state.roomId,
      code: state.code,
      ownerId: state.ownerId,
      settings: state.settings,
      worldDescription: state.worldDescription,
      phase: 'GAMEPLAY' as GamePhase,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    players: state.players as any,
    creatures: state.creatures,
    phase: 'GAMEPLAY' as GamePhase,
    turnNumber,
    additionalTags,
    additionalMetadata,
  });
}

/**
 * Build tracing config for combat
 */
export function buildTracingConfigForCombat(
  params: {
    roomId: string;
    roomCode: string;
    ownerId: string;
    settings: WorldSettings | null;
    worldDescription: string;
    createdAt: number;
    updatedAt: number;
  },
  combatState: CombatState,
  additionalTags?: string[],
  additionalMetadata?: Record<string, unknown>
): { metadata: TraceMetadata; tags: string[] } {
  // Extract character info from combat state
  const playerCharacters = combatState.characters.filter((c) => c.isPlayer);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players: any[] = playerCharacters.map((c) => ({
    id: c.id,
    userId: c.id, // In combat state, id is the player id
    name: c.name,
    character: {
      name: c.name,
      characterClass: 'Unknown', // Not available in combat state
      race: 'Unknown', // Not available in combat state
      level: Math.floor((c.proficiencyBonus - 2) / 4) + 1, // Approximate level from proficiency
    },
  }));

  return buildTracingConfig({
    room: {
      id: params.roomId,
      code: params.roomCode,
      ownerId: params.ownerId,
      settings: params.settings,
      worldDescription: params.worldDescription,
      phase: 'COMBAT' as GamePhase,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    players: players as any,
    phase: 'COMBAT' as GamePhase,
    combatRound: combatState.round,
    additionalTags: [
      ...(additionalTags || []),
      `combat_session:${combatState.sessionId}`,
      `combat_phase:${combatState.phase}`,
      combatState.isCombatOver ? 'combat:over' : 'combat:active',
      ...(combatState.winner ? [`winner:${combatState.winner}`] : []),
    ],
    additionalMetadata: {
      ...additionalMetadata,
      combat_session_id: combatState.sessionId,
      combat_round: combatState.round,
      combat_phase: combatState.phase,
      combat_over: combatState.isCombatOver,
      active_character_id: combatState.activeCharacterId,
      total_characters: combatState.characters.length,
      player_characters: playerCharacters.length,
      enemy_characters: combatState.characters.length - playerCharacters.length,
    },
  });
}

/**
 * Extract character-specific tags from a character sheet
 */
export function getCharacterTags(character: CharacterSheet): string[] {
  return [
    `character:${character.name}`,
    `class:${character.characterClass}`,
    `race:${character.race}`,
    `level:${character.level}`,
    `alignment:${character.alignment}`,
  ];
}
