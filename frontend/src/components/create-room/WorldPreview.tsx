import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, RefreshCw, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { TerrainExplorer } from '@/components/terrain/TerrainExplorer';
import { useWorldGeneration, DEFAULT_GENERATION_PARAMS, type GenerationParams } from '@/hooks/useWorldGeneration';
import Input from '@/components/ui/input';

interface WorldPreviewProps {
  onParamsChange: (params: GenerationParams, seed: string) => void;
  initialSeed?: string;
}

export function WorldPreview({ onParamsChange, initialSeed }: WorldPreviewProps) {
  const [seed, setSeed] = useState(initialSeed || 'daicer-world');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [params, setParams] = useState<GenerationParams>(DEFAULT_GENERATION_PARAMS);

  const { isGenerating, biomeGrid, biomeGrid3D, structures, generateWorld, createChunkGenerator } =
    useWorldGeneration();

  // Initial generation
  useEffect(() => {
    generateWorld(seed, 128, params);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    onParamsChange(params, seed);
  }, [params, seed, onParamsChange]);

  const handleRegenerate = () => {
    generateWorld(seed, 128, params);
  };

  const handleRandomizeSeed = () => {
    const newSeed = Math.random().toString(36).substring(2, 15);
    setSeed(newSeed);
    generateWorld(newSeed, 128, params);
  };

  const updateParam = (key: keyof GenerationParams, value: number | boolean | undefined) => {
    if (value === undefined) return; // Guard against undefined
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Create chunk generator for TerrainExplorer
  const chunkGenerator = React.useMemo(() => {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">World Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seed Control */}
            <div className="space-y-2">
              <Label>World Seed</Label>
              <div className="flex gap-2">
                <Input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Enter seed..." />
                <Button variant="outline" size="icon" onClick={handleRandomizeSeed} title="Randomize">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleRegenerate} disabled={isGenerating} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating Preview...' : 'Update Preview'}
            </Button>

            {/* Advanced Settings Toggle */}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Advanced Settings
                </span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                {/* Elevation */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Terrain (Elevation)</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Scale</span>
                      <span>{params.elevationScale.toFixed(3)}</span>
                    </div>
                    <Slider
                      value={[params.elevationScale * 1000]}
                      onValueChange={([v]) => updateParam('elevationScale', (v ?? 0) / 1000)}
                      min={5}
                      max={50}
                      step={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Roughness</span>
                      <span>{params.elevationPersistence.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[params.elevationPersistence * 100]}
                      onValueChange={([v]) => updateParam('elevationPersistence', (v ?? 0) / 100)}
                      min={10}
                      max={90}
                      step={5}
                    />
                  </div>
                </div>

                {/* Moisture */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Climate (Moisture)</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Scale</span>
                      <span>{params.moistureScale.toFixed(3)}</span>
                    </div>
                    <Slider
                      value={[params.moistureScale * 1000]}
                      onValueChange={([v]) => updateParam('moistureScale', (v ?? 0) / 1000)}
                      min={5}
                      max={50}
                      step={1}
                    />
                  </div>
                </div>

                {/* Structures */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Structures</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Density</span>
                      <span>{params.maxStructures}</span>
                    </div>
                    <Slider
                      value={[params.maxStructures]}
                      onValueChange={([v]) => updateParam('maxStructures', v)}
                      min={1}
                      max={30}
                      step={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Spacing</span>
                      <span>{params.structureMinDistance}</span>
                    </div>
                    <Slider
                      value={[params.structureMinDistance]}
                      onValueChange={([v]) => updateParam('structureMinDistance', v)}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="lg:col-span-2 min-h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden rounded-b-lg relative">
            <div className="absolute inset-0">
              <TerrainExplorer
                biomeGrid={biomeGrid.length > 0 ? biomeGrid : [['plains']]}
                biomeGrid3D={biomeGrid3D}
                structures={structures}
                roomSize={32}
                enableInfinite
                roomId={`preview-${seed}`}
                chunkGenerator={chunkGenerator}
                placementMap={null}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
