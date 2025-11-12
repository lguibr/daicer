/**
 * @file backend/src/combat/spell-targeting.ts
 * @description Backend wrapper around shared spell geometry utilities.
 */

import type { SpellEffectShape, EffectDimensions, GridPosition } from '../types/spells';
import {
  feetToSquares as sharedFeetToSquares,
  getManhattanDistance as sharedGetManhattanDistance,
  getEuclideanDistance as sharedGetEuclideanDistance,
  getChebyshevDistance as sharedGetChebyshevDistance,
  calculateConeArea as sharedCalculateConeArea,
  calculateLineArea as sharedCalculateLineArea,
  calculateSphereArea as sharedCalculateSphereArea,
  calculateCylinderArea as sharedCalculateCylinderArea,
  calculateCubeArea as sharedCalculateCubeArea,
  calculateWallArea as sharedCalculateWallArea,
  calculateSelfAuraArea as sharedCalculateSelfAuraArea,
  calculateMeleeTouchArea as sharedCalculateMeleeTouchArea,
  calculateProjectilePath as sharedCalculateProjectilePath,
  hasLineOfSight as sharedHasLineOfSight,
  getValidTargetSquares as sharedGetValidTargetSquares,
  calculateAffectedSquares as sharedCalculateAffectedSquares,
  canCauseFriendlyFire as sharedCanCauseFriendlyFire,
  requiresLineOfSight as sharedRequiresLineOfSight,
  type SpellEffectShape as SharedSpellEffectShape,
  type EffectDimensions as SharedEffectDimensions,
  type GridPosition as SharedGridPosition,
} from '../shared/spell-geometry';

const toSharedShape = (shape: SpellEffectShape): SharedSpellEffectShape => shape as SharedSpellEffectShape;
const toSharedDimensions = (dimensions: EffectDimensions): SharedEffectDimensions =>
  dimensions as SharedEffectDimensions;
const toSharedPosition = (position: GridPosition): SharedGridPosition => position as SharedGridPosition;

export const feetToSquares = (feet: number): number => sharedFeetToSquares(feet);
export const getManhattanDistance = (a: GridPosition, b: GridPosition): number =>
  sharedGetManhattanDistance(toSharedPosition(a), toSharedPosition(b));
export const getEuclideanDistance = (a: GridPosition, b: GridPosition): number =>
  sharedGetEuclideanDistance(toSharedPosition(a), toSharedPosition(b));
export const getChebyshevDistance = (a: GridPosition, b: GridPosition): number =>
  sharedGetChebyshevDistance(toSharedPosition(a), toSharedPosition(b));

export const calculateConeArea = (
  origin: GridPosition,
  direction: { x: number; y: number },
  length: number
): GridPosition[] => sharedCalculateConeArea(toSharedPosition(origin), direction, length);

export const calculateLineArea = (
  start: GridPosition,
  end: GridPosition,
  length: number,
  width: number = 5
): GridPosition[] =>
  sharedCalculateLineArea(toSharedPosition(start), toSharedPosition(end), length, width) as GridPosition[];

export const calculateSphereArea = (
  center: GridPosition,
  radius: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] =>
  sharedCalculateSphereArea(toSharedPosition(center), radius, gridWidth, gridHeight) as GridPosition[];

export const calculateCylinderArea = (
  center: GridPosition,
  radius: number,
  height: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] =>
  sharedCalculateCylinderArea(toSharedPosition(center), radius, height, gridWidth, gridHeight) as GridPosition[];

export const calculateCubeArea = (corner: GridPosition, size: number, centered: boolean = false): GridPosition[] =>
  sharedCalculateCubeArea(toSharedPosition(corner), size, centered) as GridPosition[];

export const calculateWallArea = (points: GridPosition[], thickness: number = 5): GridPosition[] =>
  sharedCalculateWallArea(points.map(toSharedPosition), thickness) as GridPosition[];

export const calculateSelfAuraArea = (
  casterPosition: GridPosition,
  radius: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] =>
  sharedCalculateSelfAuraArea(toSharedPosition(casterPosition), radius, gridWidth, gridHeight) as GridPosition[];

export const calculateMeleeTouchArea = (casterPosition: GridPosition, reach: number = 5): GridPosition[] =>
  sharedCalculateMeleeTouchArea(toSharedPosition(casterPosition), reach) as GridPosition[];

export const calculateProjectilePath = (start: GridPosition, end: GridPosition, maxRange: number): GridPosition[] =>
  sharedCalculateProjectilePath(toSharedPosition(start), toSharedPosition(end), maxRange) as GridPosition[];

export const hasLineOfSight = (from: GridPosition, to: GridPosition, blockedSquares: GridPosition[]): boolean =>
  sharedHasLineOfSight(toSharedPosition(from), toSharedPosition(to), blockedSquares.map(toSharedPosition));

export const getValidTargetSquares = (
  effectShape: SpellEffectShape,
  casterPosition: GridPosition,
  range: number,
  gridWidth: number,
  gridHeight: number
): GridPosition[] =>
  sharedGetValidTargetSquares(
    toSharedShape(effectShape),
    toSharedPosition(casterPosition),
    range,
    gridWidth,
    gridHeight
  ) as GridPosition[];

export const calculateAffectedSquares = (
  effectShape: SpellEffectShape,
  dimensions: EffectDimensions,
  casterPosition: GridPosition,
  targetPosition: GridPosition,
  gridWidth: number,
  gridHeight: number
): GridPosition[] =>
  sharedCalculateAffectedSquares(
    toSharedShape(effectShape),
    toSharedDimensions(dimensions),
    toSharedPosition(casterPosition),
    toSharedPosition(targetPosition),
    gridWidth,
    gridHeight
  ) as GridPosition[];

export const canCauseFriendlyFire = (effectShape: SpellEffectShape): boolean =>
  sharedCanCauseFriendlyFire(toSharedShape(effectShape));

export const requiresLineOfSight = (effectShape: SpellEffectShape): boolean =>
  sharedRequiresLineOfSight(toSharedShape(effectShape));
