/**
 * Noise Visualizer Component
 * Interactive simplex noise generator with real-time preview
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useNoiseGenerator, type NoiseType } from '@/hooks/useNoiseGenerator';
import { PlayCircle } from 'lucide-react';
import { SeedControl } from './SeedControl';
import { GridCanvas } from './GridCanvas';
import { DebugStats } from './DebugStats';

export function NoiseVisualizer() {
  const { seed, setSeed, noiseType, setNoiseType, params, setParams, gridSize, generateNoise } =
    useNoiseGenerator('noise-demo');

  const [noiseGrid, setNoiseGrid] = useState<number[][]>([]);
  const [generationTime, setGenerationTime] = useState(0);

  const regenerate = useCallback(() => {
    const { grid, generationTime: time } = generateNoise();
    setNoiseGrid(grid);
    setGenerationTime(time);
  }, [generateNoise]);

  // Auto-regenerate on parameter change (debounced)
  useEffect(() => {
    const timeout = setTimeout(regenerate, 300);
    return () => clearTimeout(timeout);
  }, [regenerate]);

  const renderCell = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) => {
      const value = noiseGrid[y]?.[x] ?? 0;
      // Map -1..1 to 0..255
      const grayscale = Math.floor(((value + 1) / 2) * 255);
      ctx.fillStyle = `rgb(${grayscale}, ${grayscale}, ${grayscale})`;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    },
    [noiseGrid]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Controls */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SeedControl seed={seed} onSeedChange={setSeed} />

            <div className="space-y-2">
              <Label>Noise Type</Label>
              <Select value={noiseType} onValueChange={(v) => setNoiseType(v as NoiseType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simplex">Basic Simplex</SelectItem>
                  <SelectItem value="octave">Octave (FBM)</SelectItem>
                  <SelectItem value="ridge">Ridge</SelectItem>
                  <SelectItem value="turbulence">Turbulence</SelectItem>
                  <SelectItem value="domainWarp">Domain Warp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scale: {params.scale.toFixed(3)}</Label>
              <Slider
                value={[params.scale * 1000]}
                onValueChange={(v) => v[0] != null && setParams({ ...params, scale: v[0] / 1000 })}
                min={1}
                max={100}
                step={1}
              />
            </div>

            {(noiseType === 'octave' ||
              noiseType === 'ridge' ||
              noiseType === 'turbulence' ||
              noiseType === 'domainWarp') && (
              <>
                <div className="space-y-2">
                  <Label>Octaves: {params.octaves}</Label>
                  <Slider
                    value={[params.octaves]}
                    onValueChange={(v) => v[0] != null && setParams({ ...params, octaves: v[0] })}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>

                {noiseType === 'octave' && (
                  <>
                    <div className="space-y-2">
                      <Label>Persistence: {params.persistence.toFixed(2)}</Label>
                      <Slider
                        value={[params.persistence * 100]}
                        onValueChange={(v) => v[0] != null && setParams({ ...params, persistence: v[0] / 100 })}
                        min={10}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Lacunarity: {params.lacunarity.toFixed(2)}</Label>
                      <Slider
                        value={[params.lacunarity * 10]}
                        onValueChange={(v) => v[0] != null && setParams({ ...params, lacunarity: v[0] / 10 })}
                        min={10}
                        max={40}
                        step={1}
                      />
                    </div>
                  </>
                )}

                {noiseType === 'domainWarp' && (
                  <div className="space-y-2">
                    <Label>Warp Strength: {params.warpStrength.toFixed(2)}</Label>
                    <Slider
                      value={[params.warpStrength * 100]}
                      onValueChange={(v) => v[0] != null && setParams({ ...params, warpStrength: v[0] / 100 })}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                )}
              </>
            )}

            <Button onClick={regenerate} className="w-full" size="lg">
              <PlayCircle className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </CardContent>
        </Card>

        <DebugStats
          stats={{
            'Grid Size': `${gridSize.width}x${gridSize.height}`,
            'Generation Time': `${generationTime.toFixed(2)}ms`,
            'Noise Type': noiseType,
            Octaves: params.octaves,
          }}
        />
      </div>

      {/* Visualization */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Noise Output</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {noiseGrid.length > 0 && (
              <GridCanvas
                width={gridSize.width}
                height={gridSize.height}
                cellSize={4}
                renderCell={renderCell}
                className="rounded"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
