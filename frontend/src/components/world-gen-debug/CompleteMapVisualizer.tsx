/**
 * Complete Map Visualizer
 * Full generation pipeline with TerrainExplorer
 * ALL algorithms use the SAME seed for deterministic, reproducible results
 */

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Check, Info, Lock } from 'lucide-react';
import { TerrainExplorer } from '@/components/terrain/TerrainExplorer';
import { useWorldGeneration } from '@/hooks/useWorldGeneration';
import { SeedControl } from './SeedControl';

export function CompleteMapVisualizer() {
  const [seed, setSeed] = useState('complete-map');
  const [mapSize, setMapSize] = useState(256);
  const [showParams, setShowParams] = useState(false);

  // Use the new reusable hook
  const { isGenerating, steps, biomeGrid, biomeGrid3D, structures, generateWorld, createChunkGenerator } =
    useWorldGeneration();

  // Local state for parameters (initialized with defaults)
  const [params, setParams] = useState({
    structureMinDistance: 30,
    maxStructures: 10,
    generateRoads: false,
    elevationScale: 0.02,
    elevationOctaves: 4,
    elevationPersistence: 0.5,
    moistureScale: 0.03,
    moistureOctaves: 3,
    moisturePersistence: 0.5,
    caveFillPercentage: 0.45,
    caveIterations: 5,
    caveBirthLimit: 4,
    caveDeathLimit: 3,
    bspSize: 64,
    bspMinRoomSize: 4,
    bspMaxRoomSize: 12,
    featureMinDistance: 20,
    featureAttempts: 30,
  });

  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  // Create chunk generator for TerrainExplorer
  const chunkGenerator = useMemo(() => {
    const generator = createChunkGenerator(seed, params);
    return {
      generateChunk: (worldX: number, worldY: number, width: number, height: number): string[][] => {
        const chunk3D = generator(worldX, worldY, width, height);
        // Return surface layer (floor 3 - index 3), or empty grid if not available
        return (
          chunk3D[3] ||
          Array(height)
            .fill(0)
            .map(() => Array(width).fill(''))
        );
      },
      generateChunk3D: generator,
    };
  }, [createChunkGenerator, seed, params]);

  // Wrapper to call generateWorld with current params
  const handleGenerate = useCallback(() => {
    generateWorld(seed, mapSize, params);
  }, [generateWorld, seed, mapSize, params]);

  // Update param helpers - coalesce undefined values
  const updateParam = (key: string, value: number | boolean | undefined) => {
    if (value === undefined) return; // Guard against undefined
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Map Generation Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seed Control with Determinism Badge */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SeedControl seed={seed} onSeedChange={setSeed} />
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-md">
                <Lock className="w-3 h-3 text-green-400" />
                <span className="text-xs font-mono text-green-400">100% Deterministic</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ℹ️ <strong>Master Seed:</strong> This single seed controls ALL algorithms. Same seed = identical world
              every time. Change seed to get completely different terrain.
            </p>
          </div>

          {/* Map Size Parameter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Initial Map Size: {mapSize}x{mapSize} tiles
              </Label>
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                What does this mean?
              </button>
            </div>
            <Slider value={[mapSize]} onValueChange={([v]) => setMapSize(v ?? 256)} min={32} max={2048} step={32} />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Initial Map Size</strong> determines how many tiles are generated upfront before you can
                explore.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 bg-accent/30 rounded">
                  <strong className="text-blue-400">Tiny (32-128):</strong>
                  <br />
                  Instant (&lt;0.5s). Testing algorithms only.
                </div>
                <div className="p-2 bg-accent/30 rounded">
                  <strong className="text-green-400">Small (160-512):</strong>
                  <br />
                  Fast (&lt;1s). Good for quick iteration and pattern testing.
                </div>
                <div className="p-2 bg-accent/30 rounded">
                  <strong className="text-yellow-400">Medium (640-1280):</strong>
                  <br />
                  Balanced (1-3s). Good size for exploration with visible terrain features.
                </div>
                <div className="p-2 bg-accent/30 rounded">
                  <strong className="text-orange-400">Large (1408-2048):</strong>
                  <br />
                  Slower (3-8s). Massive worlds, continental-scale features.
                </div>
                <div className="p-2 bg-purple-500/30 rounded col-span-2 border border-purple-500/50">
                  <strong className="text-purple-300">⭐ Infinite Mode (ENABLED):</strong>
                  <br />
                  After generation, use <strong>WASD</strong> to move. When you reach any edge, new chunks generate
                  <strong> instantly on the client</strong> using the same algorithms! Supports up to{' '}
                  <strong>65536x65536 tiles</strong> total. 100% parity with game backend.
                </div>
              </div>
              <p className="mt-2 text-amber-400">
                ⚠️ <strong>Note:</strong> Initial size only affects generation time. World can expand infinitely as you
                explore!
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </Button>

          {/* Generation Steps with Detailed Explanations */}
          <div className="space-y-3">
            <Label>Generation Pipeline (click step for details):</Label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedStep(selectedStep === i ? null : i)}
                    className="w-full flex items-start gap-2 text-sm hover:bg-accent/50 p-2 rounded transition-colors text-left"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.completed ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                    >
                      {step.completed && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={step.completed ? 'text-green-400 font-medium' : 'text-muted-foreground'}>
                          {step.name}
                        </span>
                        {step.deterministic && (
                          <Lock className="w-3 h-3 text-green-400" title="Deterministic with seed" />
                        )}
                        {step.timeTaken !== undefined && (
                          <span className="text-xs text-blue-400">({step.timeTaken.toFixed(0)}ms)</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block">{step.description}</span>
                    </div>
                    <Info
                      className={`w-4 h-4 flex-shrink-0 ${selectedStep === i ? 'text-blue-400' : 'text-gray-500'}`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {selectedStep === i && (
                    <div className="ml-9 p-3 bg-accent/30 border border-accent rounded text-xs space-y-2">
                      <div>
                        <strong className="text-blue-400">How it works:</strong>
                        <p className="text-muted-foreground mt-1">{step.technicalDetail}</p>
                      </div>
                      <div>
                        <strong className="text-purple-400">Determinism:</strong>
                        <p className="text-muted-foreground mt-1">
                          {step.deterministic ? (
                            <>
                              ✅ <strong>Fully deterministic.</strong> Running with the same seed will produce the exact
                              same result every single time. This step uses the master seed: "{seed}".
                            </>
                          ) : (
                            <>
                              ⚠️ <strong>Non-deterministic.</strong> Results may vary even with the same seed.
                            </>
                          )}
                        </p>
                      </div>
                      {step.timeTaken !== undefined && (
                        <div>
                          <strong className="text-yellow-400">Performance:</strong>
                          <p className="text-muted-foreground mt-1">
                            This step took <strong>{step.timeTaken.toFixed(2)}ms</strong> to complete.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terrain Explorer - WASD navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Explorable Terrain (WASD to move)</CardTitle>
        </CardHeader>
        <CardContent>
          <TerrainExplorer
            biomeGrid={biomeGrid.length > 0 ? biomeGrid : [['plains']]}
            biomeGrid3D={biomeGrid3D}
            structures={structures}
            roomSize={32}
            enableInfinite
            roomId={`debug-${seed}`}
            chunkGenerator={chunkGenerator}
            placementMap={null}
          />
        </CardContent>
      </Card>

      {/* Parameter Controls Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generation Parameters</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowParams(!showParams)}>
              {showParams ? 'Hide' : 'Show'} Parameters
            </Button>
          </div>
        </CardHeader>
        {showParams && (
          <CardContent className="space-y-6">
            {/* Structures Section */}
            <div>
              <h4 className="font-semibold mb-3">1. Structures (Phase 1)</h4>
              <div className="space-y-3">
                <div>
                  <Label>Min Distance: {params.structureMinDistance}</Label>
                  <Slider
                    value={[params.structureMinDistance]}
                    onValueChange={([v]) => updateParam('structureMinDistance', v)}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Max Structures: {params.maxStructures}</Label>
                  <Slider
                    value={[params.maxStructures]}
                    onValueChange={([v]) => updateParam('maxStructures', v)}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={params.generateRoads}
                    onChange={(e) => updateParam('generateRoads', e.target.checked)}
                  />
                  <Label>Generate Roads</Label>
                </div>
              </div>
            </div>

            {/* Elevation Noise Section */}
            <div>
              <h4 className="font-semibold mb-3">2. Elevation Noise</h4>
              <div className="space-y-3">
                <div>
                  <Label>Scale: {params.elevationScale.toFixed(3)}</Label>
                  <Slider
                    value={[params.elevationScale * 1000]}
                    onValueChange={([v]) => updateParam('elevationScale', (v ?? 0) / 1000)}
                    min={5}
                    max={50}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Octaves: {params.elevationOctaves}</Label>
                  <Slider
                    value={[params.elevationOctaves]}
                    onValueChange={([v]) => updateParam('elevationOctaves', v)}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Persistence: {params.elevationPersistence.toFixed(2)}</Label>
                  <Slider
                    value={[params.elevationPersistence * 100]}
                    onValueChange={([v]) => updateParam('elevationPersistence', (v ?? 0) / 100)}
                    min={10}
                    max={90}
                    step={5}
                  />
                </div>
              </div>
            </div>

            {/* Moisture Noise Section */}
            <div>
              <h4 className="font-semibold mb-3">3. Moisture Noise</h4>
              <div className="space-y-3">
                <div>
                  <Label>Scale: {params.moistureScale.toFixed(3)}</Label>
                  <Slider
                    value={[params.moistureScale * 1000]}
                    onValueChange={([v]) => updateParam('moistureScale', (v ?? 0) / 1000)}
                    min={5}
                    max={50}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Octaves: {params.moistureOctaves}</Label>
                  <Slider
                    value={[params.moistureOctaves]}
                    onValueChange={([v]) => updateParam('moistureOctaves', v)}
                    min={1}
                    max={8}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Persistence: {params.moisturePersistence.toFixed(2)}</Label>
                  <Slider
                    value={[params.moisturePersistence * 100]}
                    onValueChange={([v]) => updateParam('moisturePersistence', (v ?? 0) / 100)}
                    min={10}
                    max={90}
                    step={5}
                  />
                </div>
              </div>
            </div>

            {/* Cellular Automata (Caves) Section */}
            <div>
              <h4 className="font-semibold mb-3">5. Cellular Automata (Caves)</h4>
              <div className="space-y-3">
                <div>
                  <Label>Fill Percentage: {(params.caveFillPercentage * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[params.caveFillPercentage * 100]}
                    onValueChange={([v]) => updateParam('caveFillPercentage', (v ?? 0) / 100)}
                    min={20}
                    max={70}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Iterations: {params.caveIterations}</Label>
                  <Slider
                    value={[params.caveIterations]}
                    onValueChange={([v]) => updateParam('caveIterations', v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Birth Limit: {params.caveBirthLimit}</Label>
                  <Slider
                    value={[params.caveBirthLimit]}
                    onValueChange={([v]) => updateParam('caveBirthLimit', v)}
                    min={3}
                    max={6}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Death Limit: {params.caveDeathLimit}</Label>
                  <Slider
                    value={[params.caveDeathLimit]}
                    onValueChange={([v]) => updateParam('caveDeathLimit', v)}
                    min={2}
                    max={5}
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* BSP Rooms Section */}
            <div>
              <h4 className="font-semibold mb-3">6. BSP Room Layout</h4>
              <div className="space-y-3">
                <div>
                  <Label>Grid Size: {params.bspSize}</Label>
                  <Slider
                    value={[params.bspSize]}
                    onValueChange={([v]) => updateParam('bspSize', v)}
                    min={32}
                    max={128}
                    step={16}
                  />
                </div>
                <div>
                  <Label>Min Room Size: {params.bspMinRoomSize}</Label>
                  <Slider
                    value={[params.bspMinRoomSize]}
                    onValueChange={([v]) => updateParam('bspMinRoomSize', v)}
                    min={3}
                    max={8}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Max Room Size: {params.bspMaxRoomSize}</Label>
                  <Slider
                    value={[params.bspMaxRoomSize]}
                    onValueChange={([v]) => updateParam('bspMaxRoomSize', v)}
                    min={8}
                    max={20}
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* Poisson Disc (Features) Section */}
            <div>
              <h4 className="font-semibold mb-3">7. Poisson Disc (Features)</h4>
              <div className="space-y-3">
                <div>
                  <Label>Min Distance: {params.featureMinDistance}</Label>
                  <Slider
                    value={[params.featureMinDistance]}
                    onValueChange={([v]) => updateParam('featureMinDistance', v)}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Max Attempts: {params.featureAttempts}</Label>
                  <Slider
                    value={[params.featureAttempts]}
                    onValueChange={([v]) => updateParam('featureAttempts', v)}
                    min={10}
                    max={50}
                    step={5}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • <strong>Generate:</strong> Click "Generate Complete Map" to run the full pipeline with your chosen seed
              + size
            </li>
            <li>
              • <strong>WASD Movement:</strong> Navigate the terrain (red dot = your position). World is INFINITE - new
              chunks generate as you reach edges!
            </li>
            <li>
              • <strong>Infinite World:</strong> Initial map size (32-2048) is just the starting area. Move beyond edges
              to generate up to 65536x65536 total tiles on-demand. Same deterministic algorithm as backend!
            </li>
            <li>
              • <strong>Drag to Pan:</strong> Click and drag the map view for manual panning
            </li>
            <li>
              • <strong>Zoom Controls:</strong> Use +/- buttons to zoom in/out (1x-8x)
            </li>
            <li>
              • <strong>Z-Layer Slider:</strong> Toggle between Underground (-1), Surface (0), Sky (1) to see different
              vertical layers
            </li>
            <li>
              • <strong>Click to Inspect:</strong> Click any tile to see detailed metadata (biome, coordinates,
              structures, etc.)
            </li>
            <li>
              • <strong>Vision Radius:</strong> Green circle shows your visible range (40 tiles). Toggle in view
              options.
            </li>
            <li className="text-amber-400">
              ⚠️ <strong>Performance:</strong> Larger initial sizes (1280+) take longer to generate but explore
              smoothly. Chunk generation at edges is instant!
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
