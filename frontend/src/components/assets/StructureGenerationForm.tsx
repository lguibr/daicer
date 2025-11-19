/**
 * Structure Generation Form
 * Typed form for procedural structure generation (WFC + BSP)
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Input from '../ui/input';

export interface StructureGenerationParams {
  name: string;
  structureType: 'castle' | 'house' | 'dungeon' | 'tower' | 'ruins';
  width: number; // In chunks (1-10)
  height: number; // In chunks (1-10)
  floors: number; // Number of z-layers (1-5)
  seed?: string;
  // WFC parameters
  complexity: 'simple' | 'moderate' | 'complex';
  // BSP parameters
  minRoomSize: number;
  // Style
  materialPalette: 'stone' | 'wood' | 'brick' | 'mixed';
}

interface StructureGenerationFormProps {
  onSubmit: (params: StructureGenerationParams) => void;
  loading?: boolean;
}

export function StructureGenerationForm({ onSubmit, loading = false }: StructureGenerationFormProps) {
  const [params, setParams] = useState<StructureGenerationParams>({
    name: 'Simple Structure',
    structureType: 'house',
    width: 2,
    height: 2,
    floors: 1,
    complexity: 'simple',
    minRoomSize: 3,
    materialPalette: 'wood',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Structure Generation Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div>
            <label htmlFor="structure-name" className="text-sm font-medium">
              Structure Name
            </label>
            <Input
              id="structure-name"
              value={params.name}
              onChange={(e) => setParams({ ...params, name: e.target.value })}
              placeholder="Medieval Castle"
              required
            />
          </div>

          {/* Structure Type */}
          <div>
            <label htmlFor="structure-type" className="text-sm font-medium">
              Type
            </label>
            <select
              id="structure-type"
              value={params.structureType}
              onChange={(e) => setParams({ ...params, structureType: e.target.value as any })}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="castle">Castle (Large fortress)</option>
              <option value="house">House (Small building)</option>
              <option value="dungeon">Dungeon (Underground complex)</option>
              <option value="tower">Tower (Vertical structure)</option>
              <option value="ruins">Ruins (Partial structure)</option>
            </select>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="structure-width" className="text-sm font-medium">
                Width (chunks)
              </label>
              <Input
                id="structure-width"
                type="number"
                min={1}
                max={10}
                value={params.width}
                onChange={(e) => setParams({ ...params, width: parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <label htmlFor="structure-height" className="text-sm font-medium">
                Height (chunks)
              </label>
              <Input
                id="structure-height"
                type="number"
                min={1}
                max={10}
                value={params.height}
                onChange={(e) => setParams({ ...params, height: parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <label htmlFor="structure-floors" className="text-sm font-medium">
                Floors
              </label>
              <Input
                id="structure-floors"
                type="number"
                min={1}
                max={5}
                value={params.floors}
                onChange={(e) => setParams({ ...params, floors: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>

          {/* Complexity */}
          <div>
            <label htmlFor="structure-complexity" className="text-sm font-medium">
              Complexity (WFC)
            </label>
            <select
              id="structure-complexity"
              value={params.complexity}
              onChange={(e) => setParams({ ...params, complexity: e.target.value as any })}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="simple">Simple (Basic layout)</option>
              <option value="moderate">Moderate (Standard)</option>
              <option value="complex">Complex (Intricate)</option>
            </select>
          </div>

          {/* Material Palette */}
          <div>
            <label htmlFor="structure-material" className="text-sm font-medium">
              Material Palette
            </label>
            <select
              id="structure-material"
              value={params.materialPalette}
              onChange={(e) => setParams({ ...params, materialPalette: e.target.value as any })}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="stone">Stone (Castles, fortresses)</option>
              <option value="wood">Wood (Houses, cabins)</option>
              <option value="brick">Brick (Urban buildings)</option>
              <option value="mixed">Mixed (Varied materials)</option>
            </select>
          </div>

          {/* Min Room Size (BSP) */}
          <div>
            <label htmlFor="structure-minroom" className="text-sm font-medium">
              Min Room Size (BSP)
            </label>
            <Input
              id="structure-minroom"
              type="number"
              min={3}
              max={8}
              value={params.minRoomSize}
              onChange={(e) => setParams({ ...params, minRoomSize: parseInt(e.target.value, 10) })}
            />
            <p className="mt-1 text-xs text-muted-foreground">Minimum dimensions for interior rooms</p>
          </div>

          {/* Seed (Optional) */}
          <div>
            <label htmlFor="structure-seed" className="text-sm font-medium">
              Seed (Optional)
            </label>
            <Input
              id="structure-seed"
              value={params.seed || ''}
              onChange={(e) => setParams({ ...params, seed: e.target.value })}
              placeholder="Leave empty for random"
            />
          </div>

          {/* Summary */}
          <div className="rounded bg-muted p-3 text-sm">
            <p className="font-semibold">Generation Preview:</p>
            <p className="text-muted-foreground">
              {params.structureType.charAt(0).toUpperCase() + params.structureType.slice(1)} • {params.width}×
              {params.height} chunks ({params.width * 8}×{params.height * 8} tiles) • {params.floors} floor
              {params.floors > 1 ? 's' : ''} • {params.complexity} complexity • {params.materialPalette} materials
            </p>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading || !params.name} className="w-full">
            {loading ? 'Generating...' : 'Generate Structure'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
