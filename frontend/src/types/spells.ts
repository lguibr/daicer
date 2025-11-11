/**
 * @file frontend/src/types/spells.ts
 * @description Spell types for frontend (mirrors backend)
 */

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
