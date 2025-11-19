/**
 * @file frontend/src/components/shared/GridRenderer.tsx
 * @description Unified grid renderer for tactical combat and combat screens
 * Eliminates code duplication between TacticalArena and CombatGrid
 */

import { useState } from 'react';
import type { GridPosition } from '../../types/spells';

export interface GridCell {
  x: number;
  y: number;
  terrain?: string;
  blocksLOS?: boolean;
  blocksMovement?: boolean;
  movementCost?: number;
  coverBonus?: number;
}

export interface GridUnit {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  armorClass?: number;
  position: GridPosition;
  allegiance: 'player' | 'enemy' | 'neutral';
  avatar?: string;
}

export interface TerrainStyle {
  classes: string;
  indicator?: string;
  tooltip?: string;
}

export interface GridRendererProps {
  width: number;
  height: number;
  cells: GridCell[];
  units: GridUnit[];

  // Callbacks
  onSquareClick?: (position: GridPosition) => void;
  onUnitClick?: (unitId: string) => void;

  // Highlighting
  highlightedSquares?: GridPosition[];
  selectedUnitId?: string | null;
  activeUnitId?: string | null;
  reachableSquares?: GridPosition[];

  // Terrain rendering (pluggable)
  terrainRenderer?: (cell: GridCell) => TerrainStyle;

  // Optional legend
  showLegend?: boolean;
  legendItems?: Array<{ color: string; label: string }>;
}

/**
 * Default terrain renderer (minimal styling)
 */
const defaultTerrainRenderer = (cell: GridCell): TerrainStyle => {
  const baseClasses =
    'relative border border-shadow-700 aspect-square flex items-center justify-center transition-colors';

  if (cell.blocksMovement) {
    return {
      classes: `${baseClasses} bg-shadow-950 border-shadow-900 cursor-not-allowed`,
      indicator: '▓',
      tooltip: 'Blocked',
    };
  }

  return {
    classes: `${baseClasses} bg-midnight-800 hover:bg-midnight-700 cursor-pointer`,
    indicator: '',
    tooltip: 'Open Ground',
  };
};

/**
 * Unified Grid Renderer Component
 */
export function GridRenderer({
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
  terrainRenderer = defaultTerrainRenderer,
  showLegend = false,
  legendItems = [],
}: GridRendererProps) {
  const [hoveredCell, setHoveredCell] = useState<GridPosition | null>(null);

  const getCellAt = (x: number, y: number): GridCell | undefined => cells.find((c) => c.x === x && c.y === y);

  const getUnitAt = (x: number, y: number): GridUnit | undefined =>
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
    const cell = getCellAt(x, y) || { x, y };
    const unit = getUnitAt(x, y);
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
    const highlighted = isHighlighted(x, y);
    const reachable = isReachable(x, y);
    const isSelected = unit?.id === selectedUnitId;
    const isActive = unit?.id === activeUnitId;

    const terrain = terrainRenderer(cell);
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
        className={`${terrain.classes} ${hoverClasses} ${highlightClasses} ${reachableClasses} ${selectedClasses} ${activeClasses}`}
        title={terrain.tooltip}
        disabled={cell.blocksMovement && !unit}
      >
        {/* Terrain indicator */}
        {!unit && terrain.indicator && (
          <span className="text-shadow-500 text-xs absolute top-0.5 left-0.5">{terrain.indicator}</span>
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
      {/* Optional legend */}
      {showLegend && legendItems.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-shadow-300">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <div className={`w-3 h-3 ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}

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
            <div>{terrainRenderer(getCellAt(hoveredCell.x, hoveredCell.y)!).tooltip}</div>
          )}
          {getUnitAt(hoveredCell.x, hoveredCell.y) && (
            <div className="mt-1 pt-1 border-t border-shadow-700">
              <strong>{getUnitAt(hoveredCell.x, hoveredCell.y)!.name}</strong>
              <div>
                HP: {getUnitAt(hoveredCell.x, hoveredCell.y)!.hp}/{getUnitAt(hoveredCell.x, hoveredCell.y)!.maxHp}
              </div>
              {getUnitAt(hoveredCell.x, hoveredCell.y)!.armorClass && (
                <div>AC: {getUnitAt(hoveredCell.x, hoveredCell.y)!.armorClass}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
