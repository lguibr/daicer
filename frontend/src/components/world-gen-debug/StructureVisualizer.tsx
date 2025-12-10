/**
 * Structure Visualizer
 * Debug UI for testing procedural structure placement
 * Structures are first-class biomes placed BEFORE terrain generation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play } from 'lucide-react';
import { useStructureGenerator } from '@/hooks/useStructureGenerator';
import { useState, useMemo } from 'react';
import { getMaterialColor } from '@daicer/shared/world-gen/structures';
import type { StructureMaterial } from '@daicer/shared/world-gen/structures';
import { MaterialLegend } from './MaterialLegend';
import { DebugStats } from './DebugStats';
import { SeedControl } from './SeedControl';

export function StructureVisualizer() {
  const {
    seed,
    setSeed,
    mapSize,
    setMapSize,
    params,
    updateParams,
    biomeGrids,
    structures,
    isGenerating,
    generationTime,
    generate,
  } = useStructureGenerator();

  const [currentFloor, setCurrentFloor] = useState<number>(3); // 0 = -3, 1 = -2, 2 = -1, 3 = 0, 4 = 1, 5 = 2, 6 = 3

  // Get biome colors including structure biomes
  const getBiomeColor = (biome: string): string => {
    if (!biome) return '#000000';

    // Structure biomes
    if (biome.startsWith('structure_')) {
      const parts = biome.split('_');
      if (parts.length >= 3) {
        const material = parts[2] as StructureMaterial;
        try {
          return getMaterialColor(material);
        } catch {
          return '#666666';
        }
      }
    }

    // Default biome colors
    const biomeColors: Record<string, string> = {
      plains: '#84cc16',
      forest: '#166534',
      mountains: '#78716c',
      water: '#3b82f6',
      desert: '#d97706',
      swamp: '#334155',
    };

    return biomeColors[biome] || '#555555';
  };

  // Count structures by type
  const structureCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const structure of structures) {
      counts[structure.type] = (counts[structure.type] || 0) + 1;
    }
    return counts;
  }, [structures]);

  // Count structures by material
  const materialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const structure of structures) {
      counts[structure.material] = (counts[structure.material] || 0) + 1;
    }
    return counts;
  }, [structures]);

  // Count road tiles
  const roadTileCount = useMemo(() => {
    if (biomeGrids.length === 0) return 0;
    const surfaceGrid = biomeGrids[1];
    if (!surfaceGrid) return 0;
    let count = 0;
    for (const row of surfaceGrid) {
      for (const biome of row) {
        if (biome.startsWith('structure_road_')) {
          count++;
        }
      }
    }
    return count;
  }, [biomeGrids]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Structure Generation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seed Control */}
          <SeedControl seed={seed} onSeedChange={setSeed} />

          {/* Map Size */}
          <div>
            <Label>
              Map Size: {mapSize}x{mapSize}
            </Label>
            <Slider
              value={[mapSize]}
              onValueChange={([value]) => value != null && setMapSize(value)}
              min={32}
              max={512}
              step={32}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Smaller = faster generation, Larger = more structure variety
            </p>
          </div>

          {/* Min Distance */}
          <div>
            <Label>Min Distance: {params.minDistance} tiles</Label>
            <Slider
              value={[params.minDistance]}
              onValueChange={([value]) => value != null && updateParams({ minDistance: value })}
              min={10}
              max={100}
              step={5}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum spacing between structures (Poisson disc sampling)
            </p>
          </div>

          {/* Max Structures */}
          <div>
            <Label>Max Structures: {params.maxStructures}</Label>
            <Slider
              value={[params.maxStructures || 20]}
              onValueChange={([value]) => value != null && updateParams({ maxStructures: value })}
              min={5}
              max={100}
              step={5}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground mt-1">Maximum number of structures to place</p>
          </div>

          {/* Road Generation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="generate-roads"
                checked={params.generateRoads}
                onChange={(e) => updateParams({ generateRoads: e.target.checked })}
                disabled={isGenerating}
                className="w-4 h-4"
              />
              <Label htmlFor="generate-roads" className="cursor-pointer">
                Generate Roads
              </Label>
            </div>

            {params.generateRoads && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="road-material">Material:</Label>
                <Select
                  value={params.roadMaterial}
                  onValueChange={(value) => updateParams({ roadMaterial: value as StructureMaterial })}
                  disabled={isGenerating}
                >
                  <SelectTrigger id="road-material" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wood">Wood</SelectItem>
                    <SelectItem value="stone">Stone</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="marble">Marble</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button onClick={generate} disabled={isGenerating} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Structures'}
          </Button>
        </CardContent>
      </Card>

      {/* Visualization */}
      {biomeGrids.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Structure Map (Floor {currentFloor - 3})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Floor Selector */}
              <div className="flex items-center space-x-2 flex-wrap">
                <Label>Floor:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={currentFloor === 0 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentFloor(0)}
                  >
                    -3 (Deep)
                  </Button>
                  <Button
                    variant={currentFloor === 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentFloor(1)}
                  >
                    -2 (Lower)
                  </Button>
                  <Button
                    variant={currentFloor === 2 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentFloor(2)}
                  >
                    -1 (Underground)
                  </Button>
                  <Button
                    variant={currentFloor === 3 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentFloor(3)}
                  >
                    0 (Surface)
                  </Button>
                  <Button
                    variant={currentFloor === 4 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentFloor(4)}
                  >
                    +1 (Upper)
                  </Button>
                  <Button
                    variant={currentFloor === 5 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentFloor(5)}
                  >
                    +2 (Tower)
                  </Button>
                  <Button
                    variant={currentFloor === 6 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentFloor(6)}
                  >
                    +3 (Sky)
                  </Button>
                </div>
              </div>

              {/* Canvas */}
              <div className="border rounded overflow-auto" style={{ maxHeight: '600px' }}>
                <canvas
                  ref={(canvas) => {
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const grid = biomeGrids[currentFloor];
                    if (!grid) return;

                    const cellSize = Math.max(2, Math.min(8, 512 / mapSize));
                    canvas.width = mapSize * cellSize;
                    canvas.height = mapSize * cellSize;

                    // Draw biomes with material colors
                    for (let y = 0; y < mapSize; y++) {
                      for (let x = 0; x < mapSize; x++) {
                        const biome = grid[y]?.[x] || '';
                        const color = getBiomeColor(biome);

                        // Check tile type from biome string
                        const isFloor = biome.includes('_floor_');
                        const isDoor = biome.includes('_door_');
                        const isStairs = biome.includes('_stairs_');
                        const isRoad = biome.includes('_road_');

                        // Apply opacity for floors
                        if (isFloor) {
                          ctx.globalAlpha = 0.8;
                        } else {
                          ctx.globalAlpha = 1.0;
                        }

                        ctx.fillStyle = color;
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                        // Reset alpha
                        ctx.globalAlpha = 1.0;

                        // Add visual indicators for special tiles
                        if (cellSize >= 4) {
                          if (isDoor) {
                            // Border highlight for doors
                            ctx.strokeStyle = '#ffff00';
                            ctx.lineWidth = Math.max(1, cellSize / 4);
                            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                          } else if (isStairs) {
                            // Diagonal lines for stairs
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(x * cellSize, y * cellSize);
                            ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize);
                            ctx.stroke();
                          } else if (isRoad) {
                            // Horizontal lines for roads
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1;
                            const midY = (y + 0.5) * cellSize;
                            ctx.beginPath();
                            ctx.moveTo(x * cellSize, midY);
                            ctx.lineTo((x + 1) * cellSize, midY);
                            ctx.stroke();
                          }
                        }

                        // Draw borders between different materials
                        if (cellSize >= 3) {
                          const checkAndDrawBorder = (
                            nx: number,
                            ny: number,
                            x1: number,
                            y1: number,
                            x2: number,
                            y2: number
                          ) => {
                            if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize) {
                              const neighborBiome = grid[ny]?.[nx] || '';
                              const neighborMaterial = neighborBiome.split('_')[2] || '';
                              const currentMaterial = biome.split('_')[2] || '';

                              if (neighborBiome && currentMaterial && neighborMaterial !== currentMaterial) {
                                // Darken current color for border
                                const r = parseInt(color.slice(1, 3), 16);
                                const g = parseInt(color.slice(3, 5), 16);
                                const b = parseInt(color.slice(5, 7), 16);
                                const darkerColor = `rgb(${Math.floor(r * 0.6)}, ${Math.floor(
                                  g * 0.6
                                )}, ${Math.floor(b * 0.6)})`;

                                ctx.strokeStyle = darkerColor;
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(x1 * cellSize, y1 * cellSize);
                                ctx.lineTo(x2 * cellSize, y2 * cellSize);
                                ctx.stroke();
                              }
                            }
                          };

                          // Check all 4 neighbors and draw borders
                          checkAndDrawBorder(x - 1, y, x, y, x, y + 1); // Left
                          checkAndDrawBorder(x + 1, y, x + 1, y, x + 1, y + 1); // Right
                          checkAndDrawBorder(x, y - 1, x, y, x + 1, y); // Top
                          checkAndDrawBorder(x, y + 1, x, y + 1, x + 1, y + 1); // Bottom
                        }
                      }
                    }
                  }}
                  className="block"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Structure biomes rendered with material colors, borders, and tile type indicators.
              </p>
            </CardContent>
          </Card>

          {/* Legend */}
          <MaterialLegend />

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <DebugStats
                stats={{
                  'Total Structures': structures.length,
                  'Generation Time': `${generationTime.toFixed(2)}ms`,
                  'Road Tiles': roadTileCount,
                }}
              />

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Structures by Type:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(structureCounts).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type.replace('_', ' ')}:</span>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Structures by Material:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(materialCounts).map(([material, count]) => (
                    <div key={material} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: getMaterialColor(material as StructureMaterial) }}
                        />
                        <span className="capitalize">{material}:</span>
                      </div>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • <strong>Generate:</strong> Click "Generate Structures" to place structures as biomes
            </li>
            <li>
              • <strong>Structures are Biomes:</strong> Generated FIRST, before terrain. Format:{' '}
              <code>structure_house_wood_0</code>
            </li>
            <li>
              • <strong>Floor Selector:</strong> Switch between -1 (underground), 0 (surface), +1 (upper)
            </li>
            <li>
              • <strong>Roads:</strong> A* pathfinding connects structures with optimal paths
            </li>
            <li>
              • <strong>Pipeline Order:</strong> Structures → Noise → Biomes → CA/BSP → WFC (all respect structure
              boundaries)
            </li>
            <li>
              • <strong>Deterministic:</strong> Same seed + params = identical structure placement every time
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
