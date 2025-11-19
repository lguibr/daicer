/**
 * @file frontend/src/components/tactical/TacticalArena.tsx
 * @description Tactical arena grid component with 2D/3D rendering
 */

import { useState, useEffect } from 'react';
import type { GridPosition } from '../../types/spells';
import { useTactical3D } from '../../hooks/useTactical3D';
import { Button } from '../ui/button';

// Terrain type matching backend
enum TerrainType {
  FLOOR = 'floor',
  WALL = 'wall',
  DIFFICULT = 'difficult',
  COVER_HALF = 'cover_half',
  COVER_FULL = 'cover_full',
  HAZARD = 'hazard',
  ELEVATION_HIGH = 'elevation_high',
  ELEVATION_LOW = 'elevation_low',
}

interface GridCell {
  x: number;
  y: number;
  terrain: TerrainType;
  blocksLOS: boolean;
  blocksMovement: boolean;
  movementCost: number;
  coverBonus: number;
}

interface TacticalUnit {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  armorClass: number;
  position: GridPosition;
  allegiance: 'player' | 'enemy' | 'neutral';
  avatar?: string;
}

interface TacticalArenaProps {
  width: number;
  height: number;
  cells: GridCell[];
  units: TacticalUnit[];
  onSquareClick?: (position: GridPosition) => void;
  onUnitClick?: (unitId: string) => void;
  highlightedSquares?: GridPosition[];
  selectedUnitId?: string | null;
  activeUnitId?: string | null;
  reachableSquares?: GridPosition[];
}

/**
 * Get terrain color and styles
 */
function getTerrainStyles(terrain: TerrainType): string {
  const baseClasses =
    'relative border border-shadow-700 aspect-square flex items-center justify-center transition-colors';

  switch (terrain) {
    case TerrainType.WALL:
      return `${baseClasses} bg-shadow-950 border-shadow-900`;
    case TerrainType.DIFFICULT:
      return `${baseClasses} bg-amber-950/40 border-amber-900/50`;
    case TerrainType.COVER_HALF:
      return `${baseClasses} bg-yellow-950/30 border-yellow-800/40`;
    case TerrainType.COVER_FULL:
      return `${baseClasses} bg-yellow-900/50 border-yellow-700/60`;
    case TerrainType.HAZARD:
      return `${baseClasses} bg-red-950/40 border-red-900/50 animate-pulse`;
    case TerrainType.ELEVATION_HIGH:
      return `${baseClasses} bg-blue-950/30 border-blue-800/40`;
    case TerrainType.ELEVATION_LOW:
      return `${baseClasses} bg-indigo-950/30 border-indigo-900/40`;
    case TerrainType.FLOOR:
    default:
      return `${baseClasses} bg-midnight-800 hover:bg-midnight-700 cursor-pointer`;
  }
}

/**
 * Get terrain icon/indicator
 */
function getTerrainIndicator(terrain: TerrainType): string {
  switch (terrain) {
    case TerrainType.WALL:
      return '▓';
    case TerrainType.DIFFICULT:
      return '≋';
    case TerrainType.COVER_HALF:
      return '⬒';
    case TerrainType.COVER_FULL:
      return '■';
    case TerrainType.HAZARD:
      return '⚠';
    case TerrainType.ELEVATION_HIGH:
      return '▴';
    case TerrainType.ELEVATION_LOW:
      return '▾';
    default:
      return '';
  }
}

/**
 * Get terrain tooltip
 */
function getTerrainTooltip(cell: GridCell): string {
  switch (cell.terrain) {
    case TerrainType.WALL:
      return 'Wall - Blocks movement and line of sight';
    case TerrainType.DIFFICULT:
      return `Difficult Terrain - Costs ${cell.movementCost}x movement`;
    case TerrainType.COVER_HALF:
      return `Half Cover - +${cell.coverBonus} AC`;
    case TerrainType.COVER_FULL:
      return `Full Cover - +${cell.coverBonus} AC, blocks LOS`;
    case TerrainType.HAZARD:
      return 'Hazardous Terrain - Deals damage on entry';
    case TerrainType.ELEVATION_HIGH:
      return 'High Ground - +1 range bonus';
    case TerrainType.ELEVATION_LOW:
      return 'Low Ground - Disadvantage for ranged';
    default:
      return 'Open Ground';
  }
}

export function TacticalArena({
  width,
  height,
  cells,
  units,
  onSquareClick,
  onUnitClick,
  highlightedSquares = [],
  selectedUnitId = null,
  activeUnitId = null,
  reachableSquares = [],
}: TacticalArenaProps) {
  const [hoveredCell, setHoveredCell] = useState<GridPosition | null>(null);
  const [renderMode, setRenderMode] = useState<'2d' | '3d'>('2d');

  // 3D rendering hook
  const { canvasRef, isReady, error, renderArena, highlightCells, clearHighlights } = useTactical3D(
    renderMode === '3d'
  );

  // Update 3D scene when data changes
  useEffect(() => {
    if (renderMode === '3d' && isReady) {
      renderArena(cells as any, units as any);
    }
  }, [cells, units, renderMode, isReady, renderArena]);

  // Update 3D highlights
  useEffect(() => {
    if (renderMode === '3d' && isReady) {
      if (highlightedSquares.length > 0) {
        highlightCells(highlightedSquares.map((pos) => ({ x: pos.x, y: pos.y, color: '#ffff00' })));
      } else {
        clearHighlights();
      }
    }
  }, [highlightedSquares, renderMode, isReady, highlightCells, clearHighlights]);

  const getCellAt = (x: number, y: number): GridCell | undefined => cells.find((c) => c.x === x && c.y === y);

  const getUnitAt = (x: number, y: number): TacticalUnit | undefined =>
    units.find((u) => u.position.x === x && u.position.y === y);

  const isHighlighted = (x: number, y: number): boolean => highlightedSquares.some((sq) => sq.x === x && sq.y === y);

  const isReachable = (x: number, y: number): boolean => reachableSquares.some((sq) => sq.x === x && sq.y === y);

  const handleSquareClick = (x: number, y: number) => {
    const unit = getUnitAt(x, y);
    if (unit && onUnitClick) {
      onUnitClick(unit.id);
    } else if (onSquareClick) {
      onSquareClick({ x, y });
    }
  };

  const renderSquare = (x: number, y: number) => {
    const cell = getCellAt(x, y);
    if (!cell) return null;

    const unit = getUnitAt(x, y);
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
    const highlighted = isHighlighted(x, y);
    const reachable = isReachable(x, y);
    const isSelected = unit?.id === selectedUnitId;
    const isActive = unit?.id === activeUnitId;

    const terrainClasses = getTerrainStyles(cell.terrain);
    const hoverClasses = isHovered && !cell.blocksMovement ? 'ring-2 ring-aurora-400' : '';
    const highlightClasses = highlighted ? 'bg-amber-600/30' : '';
    const reachableClasses = reachable ? 'bg-aurora-900/20 border-aurora-600' : '';
    const selectedClasses = isSelected ? 'ring-2 ring-aurora-500' : '';
    const activeClasses = isActive ? 'ring-2 ring-green-400 animate-pulse' : '';

    return (
      <button
        key={`${x}-${y}`}
        type="button"
        onClick={() => handleSquareClick(x, y)}
        onMouseEnter={() => setHoveredCell({ x, y })}
        onMouseLeave={() => setHoveredCell(null)}
        className={`${terrainClasses} ${hoverClasses} ${highlightClasses} ${reachableClasses} ${selectedClasses} ${activeClasses}`}
        title={getTerrainTooltip(cell)}
        disabled={cell.blocksMovement && !unit}
      >
        {/* Terrain indicator */}
        {!unit && cell.terrain !== TerrainType.FLOOR && (
          <span className="text-shadow-500 text-xs absolute top-0.5 left-0.5">{getTerrainIndicator(cell.terrain)}</span>
        )}

        {/* Unit display */}
        {unit && (
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                unit.allegiance === 'player'
                  ? 'bg-aurora-500 text-white'
                  : unit.allegiance === 'enemy'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-500 text-white'
              }`}
            >
              {unit.avatar || unit.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-[9px] text-shadow-50 font-bold bg-midnight-900/80 px-1 rounded">
              {unit.hp}/{unit.maxHp}
            </div>
          </div>
        )}

        {/* Grid coordinates */}
        <span className="absolute bottom-0 right-0 text-[7px] text-shadow-600 pr-0.5 pb-0.5">
          {x},{y}
        </span>
      </button>
    );
  };

  return (
    <div className="relative bg-midnight-950 rounded-lg border border-shadow-800 p-4">
      {/* 2D/3D Toggle */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant={renderMode === '2d' ? 'default' : 'outline'} size="sm" onClick={() => setRenderMode('2d')}>
            2D Grid
          </Button>
          <Button variant={renderMode === '3d' ? 'default' : 'outline'} size="sm" onClick={() => setRenderMode('3d')}>
            3D View
          </Button>
        </div>
        {renderMode === '3d' && error && <span className="text-xs text-red-500">{error}</span>}
        {renderMode === '3d' && !isReady && !error && <span className="text-xs text-shadow-400">Loading 3D...</span>}
      </div>

      {/* Render based on mode */}
      {renderMode === '3d' ? (
        <div className="relative w-full h-[600px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded border border-shadow-700"
            style={{ display: 'block' }}
          />
        </div>
      ) : (
        <>
          {/* Grid legend */}
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-shadow-300">
            {/* Grid legend */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-shadow-950 border border-shadow-900" />
              <span>Wall</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-950/40 border border-amber-900/50" />
              <span>Difficult</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-950/30 border border-yellow-800/40" />
              <span>½ Cover</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-900/50 border border-yellow-700/60" />
              <span>Full Cover</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-950/40 border border-red-900/50" />
              <span>Hazard</span>
            </div>
          </div>

          {/* Grid */}
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
              maxWidth: '100%',
              aspectRatio: `${width} / ${height}`,
            }}
          >
            {Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => renderSquare(x, y)))}
          </div>

          {/* Hovered cell info */}
          {hoveredCell && (
            <div className="mt-3 text-xs text-shadow-200 bg-midnight-800 border border-shadow-700 rounded px-3 py-2">
              <div className="font-semibold">
                Position: ({hoveredCell.x}, {hoveredCell.y})
              </div>
              {getCellAt(hoveredCell.x, hoveredCell.y) && (
                <div>{getTerrainTooltip(getCellAt(hoveredCell.x, hoveredCell.y)!)}</div>
              )}
              {getUnitAt(hoveredCell.x, hoveredCell.y) && (
                <div className="mt-1 pt-1 border-t border-shadow-700">
                  <strong>{getUnitAt(hoveredCell.x, hoveredCell.y)!.name}</strong>
                  <div>
                    HP: {getUnitAt(hoveredCell.x, hoveredCell.y)!.hp}/{getUnitAt(hoveredCell.x, hoveredCell.y)!.maxHp}
                  </div>
                  <div>AC: {getUnitAt(hoveredCell.x, hoveredCell.y)!.armorClass}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
