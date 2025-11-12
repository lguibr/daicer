/**
 * @file frontend/src/types/spells.ts
 * @description Spell types for frontend (mirrors backend)
 */

import type { DiceRollResult } from './combat';

export enum SpellEffectShape {
  MELEE_TOUCH = 'melee_touch',
  RANGED_SINGLE = 'ranged_single',
  PROJECTILE_STRAIGHT = 'projectile_straight',
  CONE = 'cone',
  LINE = 'line',
  SPHERE = 'sphere',
  CYLINDER = 'cylinder',
  CUBE = 'cube',
  HEMISPHERE = 'hemisphere',
  SELF_ONLY = 'self_only',
  SELF_AURA = 'self_aura',
  WALL = 'wall',
  CHAIN = 'chain',
  CUSTOM = 'custom',
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface EffectDimensions {
  radius?: number;
  height?: number;
  length?: number;
  lineLength?: number;
  lineWidth?: number;
  size?: number;
  maxLength?: number;
  wallHeight?: number;
  thickness?: number;
}

export interface SpellData {
  id: string;
  name: string;
  level: number;
  school: string;
  imageUrl?: string | null;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: string | null;
  };
  duration: string;
  description: string;
  isRitual: boolean;
  effectShape: SpellEffectShape;
  effectDimensions: EffectDimensions;
  higherLevels?: string;
}

export interface SpellTargetingVisualization {
  casterPosition: GridPosition;
  targetPosition: GridPosition;
  affectedSquares: GridPosition[];
  validTargets: GridPosition[];
}

export interface SpellPreviewSnapshot {
  spellId: string;
  spellName: string;
  casterId: string;
  spellLevel: number;
  school?: string;
  effectShape: SpellEffectShape;
  range?: string;
  casterPosition: GridPosition;
  targetPosition: GridPosition;
  affectedSquares: GridPosition[];
  validTargets: GridPosition[];
  friendlyFireRisk: boolean;
  requiresLineOfSight: boolean;
  lineOfSightBlocked: boolean;
  obstacles?: GridPosition[];
  metadata?: Record<string, unknown>;
}

export interface SpellResolutionSnapshot {
  spellId: string;
  casterId: string;
  affectedCharacterIds: string[];
  summary: string;
  damageRolls: DiceRollResult[];
  savingThrows: DiceRollResult[];
  attackRolls: DiceRollResult[];
  friendlyFireOccurred: boolean;
}
