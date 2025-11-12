/**
 * @file frontend/src/components/combat/SpellEffectOverlay.tsx
 * @description Visual overlay showing spell effect area on combat grid
 * @note Update README.md in this directory when modifying component behavior or props
 */

import type { GridPosition, SpellEffectShape } from '../../types/spells';

interface OverlayCharacter {
  id: string;
  position: GridPosition;
  icon?: string;
  role?: 'ally' | 'enemy' | 'caster' | 'neutral';
}

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

  /** Optional squares representing projectile path */
  pathSquares?: GridPosition[];

  /** Optional squares representing notable highlights (e.g., allies) */
  highlightSquares?: GridPosition[];

  /** Squares that are blocked/obstacles */
  obstacles?: GridPosition[];

  /** Characters rendered on the grid */
  characters?: OverlayCharacter[];

  /** Optional square click handler */
  onSquareClick?: (position: GridPosition) => void;

  /** Spell effect shape type */
  effectShape: SpellEffectShape;

  /** Color for the effect (based on damage type) */
  effectColor?: string;

  /** Override the affected squares label */
  squaresLabel?: string;

  /** Additional metadata to display */
  summary?: {
    friendlyFireRisk?: boolean;
    requiresLineOfSight?: boolean;
    lineOfSightBlocked?: boolean;
  };
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
  pathSquares = [],
  highlightSquares = [],
  obstacles = [],
  characters = [],
  onSquareClick,
  effectShape,
  effectColor = 'rgba(255, 100, 100, 0.3)',
  squaresLabel,
  summary,
}: SpellEffectOverlayProps) {
  const isSquareAffected = (x: number, y: number): boolean => affectedSquares.some((sq) => sq.x === x && sq.y === y);

  const isCaster = (x: number, y: number): boolean => casterPosition.x === x && casterPosition.y === y;

  const isTarget = (x: number, y: number): boolean =>
    targetPosition ? targetPosition.x === x && targetPosition.y === y : false;

  const isObstacle = (x: number, y: number): boolean => obstacles.some((sq) => sq.x === x && sq.y === y);

  const isPathSquare = (x: number, y: number): boolean => pathSquares.some((sq) => sq.x === x && sq.y === y);

  const isHighlighted = (x: number, y: number): boolean => highlightSquares.some((sq) => sq.x === x && sq.y === y);

  const getOccupant = (x: number, y: number): OverlayCharacter | undefined =>
    characters.find((char) => char.position.x === x && char.position.y === y);

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
        {squaresLabel ?? `${affectedSquares.length} squares`}
      </div>

      {/* Summary */}
      {summary && (
        <div className="absolute left-2 bottom-2 space-y-1 text-xs text-white bg-black/60 px-3 py-2 rounded-md z-20 max-w-[240px]">
          {summary.friendlyFireRisk && <div>⚠️ Friendly fire possible</div>}
          {summary.requiresLineOfSight && !summary.lineOfSightBlocked && <div>👁️ Line of sight required</div>}
          {summary.lineOfSightBlocked && <div>🚫 Line of sight blocked</div>}
        </div>
      )}

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
            const obstacle = isObstacle(x, y);
            const onPath = isPathSquare(x, y);
            const highlighted = isHighlighted(x, y);
            const casterHere = isCaster(x, y);
            const targetHere = isTarget(x, y);
            const occupant = getOccupant(x, y);

            const ringClass =
              occupant?.role === 'ally'
                ? 'ring-2 ring-emerald-400'
                : occupant?.role === 'enemy'
                  ? 'ring-2 ring-rose-500'
                  : occupant?.role === 'caster'
                    ? 'ring-2 ring-sky-400'
                    : '';

            if (typeof onSquareClick === 'function') {
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  aria-label={`Grid square ${x},${y}`}
                  className={`
                    relative aspect-square border border-gray-700
                    ${affected ? 'opacity-80' : 'opacity-20'}
                    ${ringClass}
                    ${casterHere ? 'outline outline-2 outline-blue-400' : ''}
                    ${targetHere ? 'outline outline-2 outline-yellow-400' : ''}
                    ${highlighted ? 'shadow-inner shadow-emerald-400/60' : ''}
                    transition-all overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300
                  `}
                  style={{
                    backgroundColor: affected ? effectColor : 'transparent',
                  }}
                  onClick={() => onSquareClick({ x, y })}
                >
                  {onPath && !casterHere && !targetHere && (
                    <div className="absolute inset-[3px] rounded-sm border-2 border-sky-400 pointer-events-none" />
                  )}

                  {obstacle && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-sm text-red-200">
                      ⛔
                    </div>
                  )}

                  {casterHere && <div className="w-full h-full flex items-center justify-center text-2xl">🧙</div>}
                  {targetHere && !casterHere && (
                    <div className="w-full h-full flex items-center justify-center text-xl">🎯</div>
                  )}
                  {occupant && !casterHere && !targetHere && !obstacle && (
                    <div className="absolute inset-0 flex items-center justify-center text-xl pointer-events-none">
                      {occupant.icon ?? (occupant.role === 'ally' ? '🛡️' : occupant.role === 'enemy' ? '💀' : '⚑')}
                    </div>
                  )}
                </button>
              );
            }

            return (
              <div
                key={`${x}-${y}`}
                className={`
                  relative aspect-square border border-gray-700
                  ${affected ? 'opacity-80' : 'opacity-20'}
                  ${ringClass}
                  ${casterHere ? 'outline outline-2 outline-blue-400' : ''}
                  ${targetHere ? 'outline outline-2 outline-yellow-400' : ''}
                  ${highlighted ? 'shadow-inner shadow-emerald-400/60' : ''}
                  transition-all overflow-hidden
                `}
                style={{
                  backgroundColor: affected ? effectColor : 'transparent',
                }}
              >
                {onPath && !casterHere && !targetHere && (
                  <div className="absolute inset-[3px] rounded-sm border-2 border-sky-400 pointer-events-none" />
                )}

                {obstacle && (
                  <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-sm text-red-200">
                    ⛔
                  </div>
                )}

                {casterHere && <div className="w-full h-full flex items-center justify-center text-2xl">🧙</div>}
                {targetHere && !casterHere && (
                  <div className="w-full h-full flex items-center justify-center text-xl">🎯</div>
                )}
                {occupant && !casterHere && !targetHere && !obstacle && (
                  <div className="absolute inset-0 flex items-center justify-center text-xl pointer-events-none">
                    {occupant.icon ?? (occupant.role === 'ally' ? '🛡️' : occupant.role === 'enemy' ? '💀' : '⚑')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
