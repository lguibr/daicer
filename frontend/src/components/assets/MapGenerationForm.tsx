/**
 * Map Generation Form
 * Typed form for procedural map generation (Noise + Biomes)
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Input from '../ui/input';

export interface MapGenerationParams {
  name: string;
  width: number; // In chunks (4-32)
  height: number; // In chunks (4-32)
  seed?: string;
  // Climate parameters
  temperature: number; // -1 to 1
  moisture: number; // -1 to 1
  continentalness: number; // -1 to 1 (ocean vs land)
  // Terrain parameters
  waterLevel: number; // -0.5 to 0.5
  mountainousness: number; // 0 to 2
  // Feature parameters
  treeDensity: number; // 0 to 1
  resourceDensity: number; // 0 to 1
}

interface MapGenerationFormProps {
  onSubmit: (params: MapGenerationParams) => void;
  loading?: boolean;
}

export function MapGenerationForm({ onSubmit, loading = false }: MapGenerationFormProps) {
  const [params, setParams] = useState<MapGenerationParams>({
    name: '',
    width: 16,
    height: 16,
    temperature: 0,
    moisture: 0,
    continentalness: 0,
    waterLevel: -0.1,
    mountainousness: 1.0,
    treeDensity: 0.3,
    resourceDensity: 0.1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Generation Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div>
            <label htmlFor="map-name" className="text-sm font-medium">
              Map Name
            </label>
            <Input
              id="map-name"
              value={params.name}
              onChange={(e) => setParams({ ...params, name: e.target.value })}
              placeholder="Fantasy Overworld"
              required
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="map-width" className="text-sm font-medium">
                Width (chunks)
              </label>
              <Input
                id="map-width"
                type="number"
                min={4}
                max={32}
                value={params.width}
                onChange={(e) => setParams({ ...params, width: parseInt(e.target.value, 10) })}
              />
              <p className="text-xs text-muted-foreground">{params.width * 8} tiles</p>
            </div>
            <div>
              <label htmlFor="map-height" className="text-sm font-medium">
                Height (chunks)
              </label>
              <Input
                id="map-height"
                type="number"
                min={4}
                max={32}
                value={params.height}
                onChange={(e) => setParams({ ...params, height: parseInt(e.target.value, 10) })}
              />
              <p className="text-xs text-muted-foreground">{params.height * 8} tiles</p>
            </div>
          </div>

          {/* Climate Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Climate</h3>

            <div>
              <label className="text-sm">Temperature: {params.temperature.toFixed(1)}</label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={params.temperature}
                onChange={(e) => setParams({ ...params, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {params.temperature < -0.3 ? '❄️ Cold' : params.temperature > 0.3 ? '🔥 Hot' : '🌡️ Temperate'}
              </p>
            </div>

            <div>
              <label className="text-sm">Moisture: {params.moisture.toFixed(1)}</label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={params.moisture}
                onChange={(e) => setParams({ ...params, moisture: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {params.moisture < -0.3 ? '🏜️ Dry' : params.moisture > 0.3 ? '💧 Wet' : '🌿 Moderate'}
              </p>
            </div>

            <div>
              <label className="text-sm">Continentalness: {params.continentalness.toFixed(1)}</label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={params.continentalness}
                onChange={(e) => setParams({ ...params, continentalness: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {params.continentalness < 0 ? '🌊 Ocean' : params.continentalness > 0.3 ? '🗺️ Inland' : '🏖️ Coast'}
              </p>
            </div>
          </div>

          {/* Terrain Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Terrain</h3>

            <div>
              <label className="text-sm">Water Level: {params.waterLevel.toFixed(1)}</label>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.1}
                value={params.waterLevel}
                onChange={(e) => setParams({ ...params, waterLevel: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm">Mountainousness: {params.mountainousness.toFixed(1)}</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={params.mountainousness}
                onChange={(e) => setParams({ ...params, mountainousness: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {params.mountainousness < 0.5
                  ? '🏞️ Flat'
                  : params.mountainousness > 1.5
                    ? '🏔️ Very Mountainous'
                    : '⛰️ Hills'}
              </p>
            </div>
          </div>

          {/* Feature Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Features</h3>

            <div>
              <label className="text-sm">Tree Density: {Math.round(params.treeDensity * 100)}%</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={params.treeDensity}
                onChange={(e) => setParams({ ...params, treeDensity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm">Resource Density: {Math.round(params.resourceDensity * 100)}%</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={params.resourceDensity}
                onChange={(e) => setParams({ ...params, resourceDensity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Seed (Optional) */}
          <div>
            <label className="text-sm font-medium">Seed (Optional)</label>
            <Input
              value={params.seed || ''}
              onChange={(e) => setParams({ ...params, seed: e.target.value })}
              placeholder="Leave empty for random"
            />
          </div>

          {/* Summary */}
          <div className="rounded bg-muted p-3 text-sm">
            <p className="font-semibold">Generation Preview:</p>
            <p className="text-muted-foreground">
              {params.width}×{params.height} chunks ({params.width * 8}×{params.height * 8} tiles) •{' '}
              {params.temperature < 0 ? 'Cold' : params.temperature > 0 ? 'Hot' : 'Temperate'} •{' '}
              {params.moisture < 0 ? 'Dry' : params.moisture > 0 ? 'Wet' : 'Moderate'} •{' '}
              {params.continentalness < 0 ? 'Ocean' : 'Land'}
            </p>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading || !params.name} className="w-full">
            {loading ? 'Generating Map...' : 'Generate Map'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
