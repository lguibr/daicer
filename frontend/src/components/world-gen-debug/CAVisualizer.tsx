/**
 * Cellular Automata Cave Visualizer
 * Step-by-step cave generation visualization
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, RotateCcw , Info } from 'lucide-react';
import { Alea } from '@daicer/shared/world-gen/noise';
import { GridCanvas } from './GridCanvas';
import { SeedControl } from './SeedControl';
import { DebugStats } from './DebugStats';

interface CAParams {
  fillPercentage: number;
  birthLimit: number;
  deathLimit: number;
  iterations: number;
}

export function CAVisualizer() {
  const [seed, setSeed] = useState('ca-demo');
  const [gridSize, setGridSize] = useState({ width: 64, height: 64 });
  const [params, setParams] = useState<CAParams>({
    fillPercentage: 0.45,
    birthLimit: 4,
    deathLimit: 3,
    iterations: 5,
  });

  const [currentGrid, setCurrentGrid] = useState<boolean[][]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(300);
  const [generationTime, setGenerationTime] = useState(0);

  // Initialize grid with random fill
  const initializeGrid = useCallback(() => {
    const startTime = performance.now();
    const rng = Alea(seed);
    const grid: boolean[][] = [];

    for (let y = 0; y < gridSize.height; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < gridSize.width; x++) {
        row.push(rng() < params.fillPercentage);
      }
      grid.push(row);
    }

    setCurrentGrid(grid);
    setCurrentIteration(0);
    setGenerationTime(performance.now() - startTime);
  }, [seed, gridSize, params.fillPercentage]);

  // Count solid neighbors
  const countNeighbors = useCallback(
    (grid: boolean[][], x: number, y: number): number => {
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= gridSize.width || ny < 0 || ny >= gridSize.height) {
            count++;
            continue;
          }
          if (grid[ny][nx]) count++;
        }
      }
      return count;
    },
    [gridSize]
  );

  // Apply one CA step
  const applyStep = useCallback(() => {
    if (currentIteration >= params.iterations) return;

    const startTime = performance.now();
    const newGrid: boolean[][] = [];

    for (let y = 0; y < gridSize.height; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < gridSize.width; x++) {
        const neighbors = countNeighbors(currentGrid, x, y);
        if (currentGrid[y][x]) {
          row.push(neighbors >= params.deathLimit);
        } else {
          row.push(neighbors >= params.birthLimit);
        }
      }
      newGrid.push(row);
    }

    setCurrentGrid(newGrid);
    setCurrentIteration((prev) => prev + 1);
    setGenerationTime(performance.now() - startTime);
  }, [currentGrid, currentIteration, params, gridSize, countNeighbors]);

  // Auto-animate
  useEffect(() => {
    if (!isAnimating) return;
    if (currentIteration >= params.iterations) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      applyStep();
    }, animationSpeed);

    return () => clearTimeout(timer);
  }, [isAnimating, currentIteration, params.iterations, applyStep, animationSpeed]);

  // Initialize on mount or when params change
  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  // Render grid to canvas
  const renderGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const cellWidth = width / gridSize.width;
      const cellHeight = height / gridSize.height;

      for (let y = 0; y < gridSize.height; y++) {
        for (let x = 0; x < gridSize.width; x++) {
          const isSolid = currentGrid[y]?.[x] ?? false;
          ctx.fillStyle = isSolid ? '#1a1a1a' : '#fbbf24';
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    },
    [currentGrid, gridSize]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cellular Automata Cave Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seed Control */}
          <SeedControl seed={seed} onSeedChange={setSeed} />

          {/* Grid Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width: {gridSize.width}</Label>
              <Slider
                value={[gridSize.width]}
                onValueChange={([w]) => setGridSize((prev) => ({ ...prev, width: w }))}
                min={16}
                max={128}
                step={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Height: {gridSize.height}</Label>
              <Slider
                value={[gridSize.height]}
                onValueChange={([h]) => setGridSize((prev) => ({ ...prev, height: h }))}
                min={16}
                max={128}
                step={8}
              />
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <Label className="text-base">Algorithm Parameters (hover for details):</Label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fill Percentage: {(params.fillPercentage * 100).toFixed(0)}%</Label>
                <Info className="w-4 h-4 text-gray-500" title="Initial random density" />
              </div>
              <Slider
                value={[params.fillPercentage * 100]}
                onValueChange={([v]) => setParams((prev) => ({ ...prev, fillPercentage: v / 100 }))}
                min={30}
                max={60}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> Sets how many cells start as "solid rock" before CA rules apply.
                <br />
                <strong>Lower (30-40%):</strong> More open caves, larger chambers
                <br />
                <strong>Higher (50-60%):</strong> Denser rock, narrow tunnels
                <br />
                <strong>Deterministic:</strong> ✅ Same seed + fill % = identical starting grid
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Iterations: {params.iterations}</Label>
              <Slider
                value={[params.iterations]}
                onValueChange={([v]) => setParams((prev) => ({ ...prev, iterations: v }))}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> How many times CA rules are applied to smooth/shape caves.
                <br />
                <strong>Few (1-3):</strong> Rough, noisy caves
                <br />
                <strong>Many (7-10):</strong> Smooth, organic-looking caves
                <br />
                <strong>Recommended:</strong> 4-6 iterations for natural look
              </p>
            </div>

            <div className="space-y-2">
              <Label>Birth Limit: {params.birthLimit} neighbors</Label>
              <Slider
                value={[params.birthLimit]}
                onValueChange={([v]) => setParams((prev) => ({ ...prev, birthLimit: v }))}
                min={2}
                max={6}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> Empty cell becomes solid if ≥ this many neighbors are solid.
                <br />
                <strong>Lower (2-3):</strong> Rock grows aggressively, fills caves
                <br />
                <strong>Higher (5-6):</strong> Rock grows slowly, keeps caves open
                <br />
                <strong>Classic value:</strong> 4 (balanced growth)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Death Limit: {params.deathLimit} neighbors</Label>
              <Slider
                value={[params.deathLimit]}
                onValueChange={([v]) => setParams((prev) => ({ ...prev, deathLimit: v }))}
                min={2}
                max={6}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                <strong>What it does:</strong> Solid cell stays solid only if ≥ this many neighbors are solid.
                <br />
                <strong>Lower (2):</strong> Rock survives easily, caves shrink
                <br />
                <strong>Higher (4-5):</strong> Rock dies easily, caves expand
                <br />
                <strong>Classic value:</strong> 3 (erosion effect)
              </p>
            </div>
          </div>

          {/* Animation Speed */}
          <div className="space-y-2">
            <Label>Animation Speed: {animationSpeed}ms</Label>
            <Slider
              value={[animationSpeed]}
              onValueChange={([v]) => setAnimationSpeed(v)}
              min={100}
              max={1000}
              step={100}
            />
            <p className="text-xs text-muted-foreground">Lower = faster animation</p>
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
              disabled={currentIteration >= params.iterations}
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
            <Button onClick={applyStep} variant="outline" size="sm" disabled={currentIteration >= params.iterations}>
              <SkipForward className="w-4 h-4 mr-2" />
              Step
            </Button>
            <span className="text-sm text-muted-foreground">
              Iteration: {currentIteration} / {params.iterations}
            </span>
          </div>

          {/* Canvas */}
          <GridCanvas width={512} height={512} onRender={renderGrid} />

          {/* Stats */}
          <DebugStats
            stats={{
              'Grid Size': `${gridSize.width}x${gridSize.height}`,
              Iteration: `${currentIteration}/${params.iterations}`,
              'Step Time': `${generationTime.toFixed(2)}ms`,
              'Fill %': `${(params.fillPercentage * 100).toFixed(0)}%`,
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#1a1a1a] border border-gray-600 rounded" />
              <span className="text-sm">Solid Rock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#fbbf24] border border-gray-600 rounded" />
              <span className="text-sm">Cave/Air</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Birth Limit: Empty cells with ≥N solid neighbors become solid
            <br />
            Death Limit: Solid cells with &lt;N solid neighbors become empty
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
