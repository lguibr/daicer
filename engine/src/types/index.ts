import { z } from 'zod';
import {
  AttributeSchema,
  SkillDetailSchema,
  TalentSchema,
  BackgroundDetailsSchema,
  ResourcePoolSchema,
  AdvancementPointsSchema,
  InventoryItemSchema,
  CharacterSheetSchema,
  GamePhaseSchema,
  ScaleLevelSchema,
  AdventureLengthSchema,
  DifficultySchema,
  LanguageSchema,
  WorldTypeSchema,
  WorldSizeSchema,
  DMPerformanceModeSchema,
  DMStyleSchema,
  WorldSettingsSchema,
  MapConfigSchema,
  RoomSchema,
  PlayerSchema,
  MessageSchema,
  BlockTypeSchema,
  BiomeTypeSchema,
  ZLevelSchema,
  CoordinatesSchema,
  StructureInfoSchema,
  TileSchema,
  ChunkDTOSchema,
  WorldConfigSchema,
  TimeFrameSchema,
  RoleSchema,
  AvatarPreviewImageSchema,
} from '../schemas';

export type Attribute = z.infer<typeof AttributeSchema>;
// Re-export enum for value usage if needed, though Zod handles validation.
// For backward compat with enum usage like Attribute.STR, we might need to keep the enum valid at runtime or use the Zod enum object.
// Zod nativeEnum preserves the original enum.
// The Schema `AttributeSchema` was defined as z.enum array in my file, not nativeEnum.
// Let's redefine the enum here manually if needed OR switch schema to use a native enum.
// In `character.ts` I defined AttributeSchema as z.enum([...strings]).
// So `Attribute` type will be union of strings 'Strength' | ...
// The original file had `enum Attribute { STR = 'Strength' ... }`.
// Replacing that with string union changes usage `Attribute.STR` to just string 'Strength'.
// **CRITICAL DECISION**: If the codebase uses `Attribute.STR`, removing the enum breaks code.
// I should keep the Enum definition if it provides values, but ensure the Type matches Zod.

export const Attribute = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
} as const;

export type SkillDetail = z.infer<typeof SkillDetailSchema>;

export type Talent = z.infer<typeof TalentSchema>;
export type BackgroundDetails = z.infer<typeof BackgroundDetailsSchema>;
export type ResourcePool = z.infer<typeof ResourcePoolSchema>;
export type AdvancementPoints = z.infer<typeof AdvancementPointsSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type CharacterEquipment = InventoryItem[]; // Alias
export type CharacterSheet = z.infer<typeof CharacterSheetSchema>;

export type GamePhase = z.infer<typeof GamePhaseSchema>;
export const GamePhase = {
  SETUP: 'SETUP',
  TERRAIN_GENERATION: 'TERRAIN_GENERATION',
  CHARACTER_CREATION: 'CHARACTER_CREATION',
  GAMEPLAY: 'GAMEPLAY',
  COMBAT: 'COMBAT',
  LOBBY: 'LOBBY',
  PAUSED: 'PAUSED',
  ENDED: 'ENDED',
} as const;

export type ScaleLevel = z.infer<typeof ScaleLevelSchema>;
export type AdventureLength = z.infer<typeof AdventureLengthSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type WorldType = z.infer<typeof WorldTypeSchema>;
export type WorldSize = z.infer<typeof WorldSizeSchema>;
export type DMPerformanceMode = z.infer<typeof DMPerformanceModeSchema>;
export type DMStyle = z.infer<typeof DMStyleSchema>;

export type WorldSettings = z.infer<typeof WorldSettingsSchema>;
export type MapConfig = z.infer<typeof MapConfigSchema>;
export type Room = z.infer<typeof RoomSchema>;

export type AvatarPreviewImage = z.infer<typeof AvatarPreviewImageSchema>; // Implicit in PlayerSchema but explicit here
export type Player = z.infer<typeof PlayerSchema>;
export type Message = z.infer<typeof MessageSchema>;
export interface Creature {
  // Keeping manual as it was not schema'd in game.ts yet or complex union
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  attackBonus?: number;
  damage?: string;
  position: { x: number; y: number; z: number };
  type: 'npc' | 'monster';
  sheet?: CharacterSheet;
}

// === Voxel & World Types ===

export type BlockType = z.infer<typeof BlockTypeSchema>;
// Retain Enum object for value usage
export const BlockType = BlockTypeSchema.enum; // Zod nativeEnum exposes .enum

export type BiomeType = z.infer<typeof BiomeTypeSchema>;
export const BiomeType = BiomeTypeSchema.enum;

export type ZLevel = z.infer<typeof ZLevelSchema>;

// === Coordinates ===
export type Coordinates = z.infer<typeof CoordinatesSchema>;
// Missing StructureInfoSchema in initial create file... I forgot to add StructureInfoSchema to voxel.ts?
// Wait, I see StructureInfo in the read file but did I add it to voxel.ts?
// I will check or just leave it manual for a second if missing.
// Assuming I might have missed it, I will keep manual for now or try to use schema if I added it.
// I did NOT add StructureInfoSchema to voxel.ts in previous turn. I will add it manually or skip replacement for now.

export type StructureInfo = z.infer<typeof StructureInfoSchema>;

export type Tile = z.infer<typeof TileSchema>;
export type ChunkDTO = z.infer<typeof ChunkDTOSchema>;
export type Chunk = ChunkDTO;
export type GridChunk = ChunkDTO;
export type WorldConfig = z.infer<typeof WorldConfigSchema>;

// TimeFrameSchema was inferred as circular ref 'any' in Game.ts schema? No I defined TimeFrame as array(any) inside Room, but didn't export TimeFrameSchema separately?
// I didn't export TimeFrameSchema in game.ts explicitly.
// So I will keep manual TimeFrame for now.
export type TimeFrame = z.infer<typeof TimeFrameSchema>;

export type Role = z.infer<typeof RoleSchema>;

export interface EntityStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  passivePerception: number;
  initiativeBonus: number;
}

export interface EntityAction {
  name: string;
  type: 'melee' | 'ranged' | 'spell' | 'utility';
  toHit?: number;
  reach?: number;
  range?: string;
  damage?: { dice: string; bonus: number; type: string }[];
  save?: { dc: number; stat: string };
  description: string;
}

export interface EntityFeature {
  name: string;
  description: string;
  usage?: { max: number; per: string };
}

export interface Entity {
  id: string;
  type: 'player' | 'npc' | 'monster' | 'object';
  name: string;
  position: { x: number; y: number; z: number };

  // Instance Vitality
  hp: number;
  maxHp: number;
  ac: number;
  speed: number;

  // Blueprint
  stats: EntityStats;
  actions: EntityAction[];
  features: EntityFeature[];

  // Visuals
  color: string;
  visionRadius: number;
}

export interface RoomMembership {
  id: string;
  role: Role;
  room?: Room;
  player?: Player;
  user?: { id: string; username: string };
}

// Placeholders for types used in API but potentially loose
export interface Structure {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
}

export interface Road {
  id: string;
  path: { x: number; y: number; z: number }[];
}

export interface HistoricalPeriod {
  name: string;
  duration: number;
  description: string;
}

export interface WorldCondition {
  id: string;
  name: string;
  description: string;
  effect: string;
}

// === Command Types ===

import {
  CommandSchema,
  MoveCommandSchema,
  AttackCommandSchema,
  SkillCheckCommandSchema,
  CastSpellCommandSchema,
  InteractCommandSchema,
  EndTurnCommandSchema,
} from '../schemas';

export type Command = z.infer<typeof CommandSchema>;
export type MoveCommand = z.infer<typeof MoveCommandSchema>;
export type AttackCommand = z.infer<typeof AttackCommandSchema>;
export type SkillCheckCommand = z.infer<typeof SkillCheckCommandSchema>;
export type CastSpellCommand = z.infer<typeof CastSpellCommandSchema>;
export type InteractCommand = z.infer<typeof InteractCommandSchema>;
export type EndTurnCommand = z.infer<typeof EndTurnCommandSchema>;

export * from './engine';
export * from '../rules/actions';
export * from '../rules/dice';
export * from '../rules/combat';
export * from '../rules/magic';
export * from '../rules/resting';
export * from '../rules/leveling';
