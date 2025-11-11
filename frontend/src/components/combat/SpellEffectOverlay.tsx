/**
 * @file frontend/src/components/combat/SpellEffectOverlay.tsx
 * @description Visual overlay showing spell effect area on combat grid
 * @note Update README.md in this directory when modifying component behavior or props
 */

import type { GridPosition, SpellEffectShape } from '../../types/spells';

interface SpellEffectOverlayProps {
  /** Grid dimensions */
  gridWidth: number;
  gridHeight: number;

  /** Caster position */
  casterPosition: GridPosition;

  /** Target position (for point-target spells) */
  targetPosition?: GridPosition;

  /** Squares affected by spell */
  affectedSquares: GridPosition[];

  /** Spell effect shape type */
  effectShape: SpellEffectShape;

  /** Color for the effect (based on damage type) */
  effectColor?: string;
}

/**
 * Overlay component showing spell effect visualization on combat grid
 */
export function SpellEffectOverlay({
  gridWidth,
  gridHeight,
  casterPosition,
  targetPosition,
  affectedSquares,
  effectShape,
  effectColor = 'rgba(255, 100, 100, 0.3)',
}: SpellEffectOverlayProps) {
  const isSquareAffected = (x: number, y: number): boolean => affectedSquares.some((sq) => sq.x === x && sq.y === y);

  const isCaster = (x: number, y: number): boolean => casterPosition.x === x && casterPosition.y === y;

  const isTarget = (x: number, y: number): boolean =>
    targetPosition ? targetPosition.x === x && targetPosition.y === y : false;

  // Get effect shape icon/label
  const getShapeLabel = (): string => {
    switch (effectShape) {
      case 'cone':
        return '🔺 Cone';
      case 'sphere':
        return '⭕ Sphere';
      case 'line':
        return '➖ Line';
      case 'cube':
        return '🟦 Cube';
      case 'cylinder':
        return '🔵 Cylinder';
      case 'self_only':
        return '👤 Self';
      case 'self_aura':
        return '💫 Aura';
      case 'wall':
        return '🧱 Wall';
      case 'melee_touch':
        return '👊 Touch';
      case 'ranged_single':
        return '🎯 Single';
      default:
        return '✨ Effect';
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Effect Label */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm font-bold z-20">
        {getShapeLabel()}
      </div>

      {/* Affected Squares Count */}
      <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm z-20">
        {affectedSquares.length} squares
      </div>

      {/* Grid Overlay */}
      <div
        className="grid gap-0.5 w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: gridHeight }, (_row, y) =>
          Array.from({ length: gridWidth }, (_col, x) => {
            const affected = isSquareAffected(x, y);
            const casterHere = isCaster(x, y);
            const targetHere = isTarget(x, y);

            return (
              <div
                key={`${x}-${y}`}
                className={`
                  aspect-square border border-gray-700
                  ${affected ? 'opacity-70' : 'opacity-20'}
                  ${casterHere ? 'ring-2 ring-blue-400' : ''}
                  ${targetHere ? 'ring-2 ring-yellow-400' : ''}
                  transition-all
                `}
                style={{
                  backgroundColor: affected ? effectColor : 'transparent',
                }}
              >
                {casterHere && <div className="w-full h-full flex items-center justify-center text-2xl">🧙</div>}
                {targetHere && !casterHere && (
                  <div className="w-full h-full flex items-center justify-center text-xl">🎯</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
