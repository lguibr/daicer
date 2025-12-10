/**
 * Wave Function Collapse Visualizer
 * Step-by-step entropy collapse with heatmap
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { getPresetTiles } from '@daicer/shared/world-gen/wfc';
import { Alea } from '@daicer/shared/world-gen/noise';
import { GridCanvas } from './GridCanvas';
import { SeedControl } from './SeedControl';
import { DebugStats } from './DebugStats';

interface Cell {
  x: number;
  y: number;
  collapsed: boolean;
  options: Set<string>;
  tileId?: string;
}

type PresetType = 'castle' | 'house' | 'dungeon' | 'terrain';

export function WFCVisualizer() {
  const [seed, setSeed] = useState('wfc-demo');
  const [gridSize, setGridSize] = useState({ width: 16, height: 16 });
  const [preset, setPreset] = useState<PresetType>('castle');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(200);
  const [generationTime, setGenerationTime] = useState(0);
  const [tiles, setTiles] = useState<any[]>([]);

  // Tile colors
  const TILE_COLORS: Record<string, string> = {
    grass: '#84cc16',
    forest: '#166534',
    stone: '#78716c',
    mountain: '#57534e',
    water: '#3b82f6',
    sand: '#fde047',
    wall: '#1a1a1a',
    floor: '#d4d4d4',
    door: '#92400e',
    empty: '#0a0a0a',
  };

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const startTime = performance.now();
    const presetTiles = getPresetTiles(preset);
    setTiles(presetTiles);

    const allTileIds = presetTiles.map((t: any) => t.id);
    const newGrid: Cell[][] = [];

    for (let y = 0; y < gridSize.height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < gridSize.width; x++) {
        row.push({
          x,
          y,
          collapsed: false,
          options: new Set(allTileIds),
        });
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setCurrentStep(0);
    setGenerationTime(performance.now() - startTime);
  }, [preset, gridSize]);

  // Find minimum entropy cell
  const findMinEntropyCell = useCallback((cells: Cell[][]): Cell | null => {
    let minEntropy = Infinity;
    const candidates: Cell[] = [];

    for (const row of cells) {
      for (const cell of row) {
        if (cell.collapsed) continue;
        const entropy = cell.options.size;
        if (entropy === 0) return null; // Contradiction
        if (entropy < minEntropy) {
          minEntropy = entropy;
          candidates.length = 0;
          candidates.push(cell);
        } else if (entropy === minEntropy) {
          candidates.push(cell);
        }
      }
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  }, []);

  // Collapse one cell
  const collapseStep = useCallback(() => {
    const cell = findMinEntropyCell(grid);
    if (!cell) {
      setIsAnimating(false);
      return;
    }

    const rng = Alea(seed + currentStep);
    const optionsArray = Array.from(cell.options);
    const chosen = optionsArray[Math.floor(rng() * optionsArray.length)];

    if (!chosen) return;
    cell.collapsed = true;
    cell.tileId = chosen;
    cell.options = new Set([chosen]);

    setGrid([...grid]);
    setCurrentStep((prev) => prev + 1);
  }, [grid, findMinEntropyCell, seed, currentStep]);

  // Auto-animate
  useEffect(() => {
    if (!isAnimating) return;

    const allCollapsed = grid.every((row) => row.every((cell) => cell.collapsed));
    if (allCollapsed) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      collapseStep();
    }, animationSpeed);

    return () => clearTimeout(timer);
  }, [isAnimating, grid, collapseStep, animationSpeed]);

  // Initialize on mount
  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  // Render WFC state
  const renderWFC = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (grid.length === 0) return;

      const cellWidth = width / gridSize.width;
      const cellHeight = height / gridSize.height;

      for (let y = 0; y < gridSize.height; y++) {
        for (let x = 0; x < gridSize.width; x++) {
          const cell = grid[y]?.[x];
          if (!cell) continue;

          if (cell.collapsed && cell.tileId) {
            // Show collapsed tile with actual color
            const color = TILE_COLORS[cell.tileId] || '#888888';
            ctx.fillStyle = color;
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
          } else {
            // Show entropy heatmap (uncollapsed cells)
            const maxOptions = tiles.length;
            const optionCount = cell.options.size;

            if (optionCount === 0) {
              // Contradiction - red
              ctx.fillStyle = '#ff0000';
            } else {
              // Entropy heatmap: more options = blue (cool), fewer = red (hot)
              const entropy = optionCount / maxOptions;
              const hue = 240 * entropy; // 0 = red, 240 = blue
              ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
            }

            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

            // Show option count
            if (cellWidth > 15) {
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${Math.floor(cellWidth * 0.5)}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 3;
              ctx.strokeText(String(optionCount), x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2);
              ctx.fillText(String(optionCount), x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2);
            }
          }

          // Grid lines
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    },
    [grid, gridSize, tiles]
  );

  const collapsedCount = grid.flat().filter((c) => c.collapsed).length;
  const totalCells = gridSize.width * gridSize.height;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wave Function Collapse (WFC)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seed Control */}
          <SeedControl seed={seed} onSeedChange={setSeed} />

          {/* Grid Size */}
          <div className="space-y-4">
            <Label className="text-base">Grid Size:</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width: {gridSize.width} cells</Label>
                <Slider
                  value={[gridSize.width]}
                  onValueChange={([w]) => w != null && setGridSize((prev) => ({ ...prev, width: w }))}
                  min={8}
                  max={32}
                  step={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Height: {gridSize.height} cells</Label>
                <Slider
                  value={[gridSize.height]}
                  onValueChange={([h]) => h != null && setGridSize((prev) => ({ ...prev, height: h }))}
                  min={8}
                  max={32}
                  step={2}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>What it does:</strong> Size of the structure to generate (castle, dungeon, etc.).
              <br />
              <strong>Smaller (8-16):</strong> Fast collapse, good for testing patterns
              <br />
              <strong>Larger (20-32):</strong> Complex structures, but slower and may fail (contradictions)
              <br />
              <strong>Note:</strong> WFC can fail on large grids if constraints are too strict
            </p>
          </div>

          {/* Preset Selection */}
          <div className="space-y-2">
            <Label>Preset Pattern (defines tile rules)</Label>
            <Select value={preset} onValueChange={(v) => setPreset(v as PresetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="castle">Castle (walls, floors, doors)</SelectItem>
                <SelectItem value="house">House (simple rooms)</SelectItem>
                <SelectItem value="dungeon">Dungeon (multi-room complex)</SelectItem>
                <SelectItem value="terrain">Terrain (natural landscape)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              <strong>What it does:</strong> Each preset has different tile types and adjacency rules.
              <br />
              <strong>Castle:</strong> Walls, floors, doors. Good for fortifications.
              <br />
              <strong>House:</strong> Simple rectangular rooms. Clean layouts.
              <br />
              <strong>Dungeon:</strong> Complex interconnected rooms. Maze-like.
              <br />
              <strong>Terrain:</strong> Grass, forest, water, mountains. Natural biomes.
              <br />
              <strong>Deterministic:</strong> ✅ Same seed + preset = identical structure
            </p>
          </div>

          {/* Animation Speed */}
          <div className="space-y-2">
            <Label>Animation Speed: {animationSpeed}ms</Label>
            <Slider
              value={[animationSpeed]}
              onValueChange={([v]) => v != null && setAnimationSpeed(v)}
              min={50}
              max={500}
              step={50}
            />
            <p className="text-xs text-muted-foreground">Lower = faster collapse</p>
          </div>

          {/* Step Controls */}
          <div className="flex items-center gap-3">
            <Button onClick={initializeGrid} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={() => setIsAnimating(!isAnimating)}
              variant="default"
              size="sm"
              disabled={collapsedCount >= totalCells}
            >
              {isAnimating ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Animate
                </>
              )}
            </Button>
            <Button onClick={collapseStep} variant="outline" size="sm" disabled={collapsedCount >= totalCells}>
              <SkipForward className="w-4 h-4 mr-2" />
              Step
            </Button>
            <span className="text-sm text-muted-foreground">
              Collapsed: {collapsedCount} / {totalCells}
            </span>
          </div>

          {/* Canvas */}
          <GridCanvas width={512} height={512} onRender={renderWFC} />

          {/* Stats */}
          <DebugStats
            stats={{
              'Grid Size': `${gridSize.width}x${gridSize.height}`,
              Collapsed: `${collapsedCount}/${totalCells}`,
              Step: currentStep,
              Time: `${generationTime.toFixed(2)}ms`,
              Preset: preset,
            }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-red-500 rounded" />
              <span className="text-sm">Entropy Heatmap (Blue=high, Red=low)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-600 border border-white rounded" />
              <span className="text-sm">Collapsed Tiles (preset color)</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            WFC selects the cell with minimum entropy (fewest options), collapses it to one tile, then propagates
            constraints to neighbors. Numbers show remaining options per cell.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
