/**
 * WorldGenParametersPanel Component
 * Extended parameters panel for world generation with collapsible sections
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Label from '../ui/label';
import { Slider } from '../ui/slider';

export interface GenerationParams {
  structureMinDistance: number;
  maxStructures: number;
  generateRoads: boolean;
  elevationScale: number;
  elevationOctaves: number;
  elevationPersistence: number;
  moistureScale: number;
  moistureOctaves: number;
  moisturePersistence: number;
  caveFillPercentage: number;
  caveIterations: number;
  bspSize: number;
  bspMinRoomSize: number;
  bspMaxRoomSize: number;
  featureMinDistance: number;
  featureAttempts: number;
}
// import { SeedControl } from '../world-gen-debug/SeedControl';
function SeedControl({ seed, onSeedChange, label }: any) {
  return <div className="flex flex-col space-y-2">
    <Label>{label}</Label>
    <div className="flex space-x-2">
      <input
        type="text"
        value={seed}
        onChange={(e) => onSeedChange(e.target.value)}
        className="flex-1 bg-black/20 border border-accent/20 rounded px-3 py-1 text-sm"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSeedChange(Math.random().toString(36).substring(7))}
        title="Randomize"
      >
        🎲
      </Button>
    </div>
  </div>
}

interface WorldGenParametersPanelProps {
  seed: string;
  onSeedChange: (seed: string) => void;
  mapSize: number;
  onMapSizeChange: (size: number) => void;
  params: GenerationParams;
  onParamsChange: (params: GenerationParams) => void;
  onGenerate: () => void;
  onSave?: () => void;
  isGenerating: boolean;
  hasPreview: boolean;
  showSaveButton?: boolean;
}

export function WorldGenParametersPanel({
  seed,
  onSeedChange,
  mapSize,
  onMapSizeChange,
  params,
  onParamsChange,
  onGenerate,
  onSave,
  isGenerating,
  hasPreview,
  showSaveButton = false,
}: WorldGenParametersPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateParam = (key: keyof GenerationParams, value: number | boolean) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Seed Control */}
      <Card className="border-accent/30 bg-midnight-900/70">
        <CardContent className="p-4">
          <SeedControl seed={seed} onSeedChange={onSeedChange} label="World Seed" />
        </CardContent>
      </Card>

      {/* Map Size */}
      <Card className="border-accent/30 bg-midnight-900/70">
        <CardContent className="p-4 space-y-2">
          <Label>
            Initial Map Size: {mapSize}x{mapSize} tiles
          </Label>
          <Slider value={[mapSize]} onValueChange={([v]) => onMapSizeChange(v ?? 256)} min={64} max={1024} step={32} />
          <p className="text-xs text-shadow-400">Starting area size. World expands infinitely as you explore.</p>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button onClick={onGenerate} disabled={isGenerating} className="w-full bg-accent hover:bg-accent/90">
        {isGenerating ? 'Generating Preview...' : hasPreview ? 'Regenerate Preview' : 'Generate Preview'}
      </Button>

      {/* Save Button */}
      {showSaveButton && hasPreview && onSave && (
        <Button onClick={onSave} className="w-full bg-green-600 hover:bg-green-700">
          Save World
        </Button>
      )}

      {/* Advanced Parameters (Collapsible) */}
      <Card className="border-accent/30 bg-midnight-900/70">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Advanced Parameters</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="h-6 w-6 p-0">
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="p-4 space-y-6">
            {/* Structures */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-accent">Structures</h4>
              <div>
                <Label className="text-xs">Min Distance: {params.structureMinDistance}</Label>
                <Slider
                  value={[params.structureMinDistance]}
                  onValueChange={([v]) => updateParam('structureMinDistance', v ?? 30)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
              <div>
                <Label className="text-xs">Max Structures: {params.maxStructures}</Label>
                <Slider
                  value={[params.maxStructures]}
                  onValueChange={([v]) => updateParam('maxStructures', v ?? 10)}
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
                  className="w-4 h-4"
                />
                <Label className="text-xs">Generate Roads</Label>
              </div>
            </div>

            {/* Elevation Noise */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-accent">Elevation Noise</h4>
              <div>
                <Label className="text-xs">Scale: {params.elevationScale.toFixed(3)}</Label>
                <Slider
                  value={[params.elevationScale * 1000]}
                  onValueChange={([v]) => updateParam('elevationScale', (v ?? 20) / 1000)}
                  min={5}
                  max={50}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-xs">Octaves: {params.elevationOctaves}</Label>
                <Slider
                  value={[params.elevationOctaves]}
                  onValueChange={([v]) => updateParam('elevationOctaves', v ?? 4)}
                  min={1}
                  max={8}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-xs">Persistence: {params.elevationPersistence.toFixed(2)}</Label>
                <Slider
                  value={[params.elevationPersistence * 100]}
                  onValueChange={([v]) => updateParam('elevationPersistence', (v ?? 50) / 100)}
                  min={10}
                  max={90}
                  step={5}
                />
              </div>
            </div>

            {/* Moisture Noise */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-accent">Moisture Noise</h4>
              <div>
                <Label className="text-xs">Scale: {params.moistureScale.toFixed(3)}</Label>
                <Slider
                  value={[params.moistureScale * 1000]}
                  onValueChange={([v]) => updateParam('moistureScale', (v ?? 30) / 1000)}
                  min={5}
                  max={50}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-xs">Octaves: {params.moistureOctaves}</Label>
                <Slider
                  value={[params.moistureOctaves]}
                  onValueChange={([v]) => updateParam('moistureOctaves', v ?? 3)}
                  min={1}
                  max={8}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-xs">Persistence: {params.moisturePersistence.toFixed(2)}</Label>
                <Slider
                  value={[params.moisturePersistence * 100]}
                  onValueChange={([v]) => updateParam('moisturePersistence', (v ?? 50) / 100)}
                  min={10}
                  max={90}
                  step={5}
                />
              </div>
            </div>

            {/* Caves (CA) */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-accent">Caves (Cellular Automata)</h4>
              <div>
                <Label className="text-xs">Fill: {(params.caveFillPercentage * 100).toFixed(0)}%</Label>
                <Slider
                  value={[params.caveFillPercentage * 100]}
                  onValueChange={([v]) => updateParam('caveFillPercentage', (v ?? 45) / 100)}
                  min={20}
                  max={70}
                  step={5}
                />
              </div>
              <div>
                <Label className="text-xs">Iterations: {params.caveIterations}</Label>
                <Slider
                  value={[params.caveIterations]}
                  onValueChange={([v]) => updateParam('caveIterations', v ?? 5)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            {/* BSP */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-accent">BSP Rooms</h4>
              <div>
                <Label className="text-xs">Grid Size: {params.bspSize}</Label>
                <Slider
                  value={[params.bspSize]}
                  onValueChange={([v]) => updateParam('bspSize', v ?? 64)}
                  min={32}
                  max={128}
                  step={16}
                />
              </div>
              <div>
                <Label className="text-xs">Min Room: {params.bspMinRoomSize}</Label>
                <Slider
                  value={[params.bspMinRoomSize]}
                  onValueChange={([v]) => updateParam('bspMinRoomSize', v ?? 4)}
                  min={3}
                  max={8}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-xs">Max Room: {params.bspMaxRoomSize}</Label>
                <Slider
                  value={[params.bspMaxRoomSize]}
                  onValueChange={([v]) => updateParam('bspMaxRoomSize', v ?? 12)}
                  min={8}
                  max={20}
                  step={1}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-accent">Feature Distribution</h4>
              <div>
                <Label className="text-xs">Min Distance: {params.featureMinDistance}</Label>
                <Slider
                  value={[params.featureMinDistance]}
                  onValueChange={([v]) => updateParam('featureMinDistance', v ?? 20)}
                  min={5}
                  max={50}
                  step={5}
                />
              </div>
              <div>
                <Label className="text-xs">Max Attempts: {params.featureAttempts}</Label>
                <Slider
                  value={[params.featureAttempts]}
                  onValueChange={([v]) => updateParam('featureAttempts', v ?? 30)}
                  min={10}
                  max={50}
                  step={5}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
