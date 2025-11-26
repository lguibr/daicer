import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { TerrainExplorer } from '@/components/terrain/TerrainExplorer';
import { useWorldGeneration, DEFAULT_GENERATION_PARAMS } from '@/hooks/useWorldGeneration';
import Input from '@/components/ui/input';

export default function MapExplorer() {
  const [seed, setSeed] = useState('explorer-map');
  const [params] = useState(DEFAULT_GENERATION_PARAMS);

  // Use the SAME working hook as CompleteMapVisualizer
  const { isGenerating, biomeGrid, biomeGrid3D, structures, generateWorld, createChunkGenerator } =
    useWorldGeneration();

  // Generate initial world
  useEffect(() => {
    generateWorld(seed, 128, params);
  }, []); // Only on mount

  // Create chunk generator for infinite terrain
  const chunkGenerator = useMemo(() => {
    const generator = createChunkGenerator(seed, params);
    return {
      generateChunk: (worldX: number, worldY: number, width: number, height: number): string[][] => {
        const chunk3D = generator(worldX, worldY, width, height);
        return (
          chunk3D[3] ||
          Array(height)
            .fill(0)
            .map(() => Array(width).fill('plains'))
        );
      },
      generateChunk3D: generator,
    };
  }, [createChunkGenerator, seed, params]);

  const handleRandomizeSeed = () => {
    const newSeed = Math.random().toString(36).substring(2, 15);
    setSeed(newSeed);
    generateWorld(newSeed, 128, params);
  };

  const handleRegenerate = () => {
    generateWorld(seed, 128, params);
  };

  return (
    <div className="min-h-screen p-6 bg-midnight-950 text-shadow-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-aurora-300">Map Explorer Prototype</h1>
          <p className="text-sm text-shadow-400 mt-2">
            Use WASD to move around the procedurally generated world. Chunks load on-demand with real biome generation.
          </p>
        </Card>

        {/* Controls */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-shadow-500 mb-1 block">World Seed</label>
              <div className="flex gap-2">
                <Input value={seed} onChange={(e) => setSeed(e.target.value)} className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleRandomizeSeed}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="pt-5">
              <Button onClick={handleRegenerate} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card className="p-0 overflow-hidden min-h-[600px]">
          {biomeGrid.length > 0 ? (
            <TerrainExplorer
              biomeGrid={biomeGrid}
              biomeGrid3D={biomeGrid3D}
              structures={structures}
              roomSize={32}
              initialZoom={2}
              enableInfinite
              roomId={`explorer-${seed}`}
              chunkGenerator={chunkGenerator}
              placementMap={null}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <p className="text-shadow-500">Generating world...</p>
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-2">Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-mono text-aurora-300">WASD</p>
              <p className="text-shadow-400">Move around</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-aurora-300">Mouse Wheel</p>
              <p className="text-shadow-400">Zoom in/out</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-aurora-300">Mouse Drag</p>
              <p className="text-shadow-400">Pan view</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-aurora-300">Z/X</p>
              <p className="text-shadow-400">Change floor level</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
