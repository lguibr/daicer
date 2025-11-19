/**
 * WorldParametersForm Component
 * Form for creating procedural worlds with climate and terrain controls
 */

import { useState } from 'react';
import { Dices } from 'lucide-react';
import Input from '../ui/input';
import Label from '../ui/label';
import { Button } from '../ui/button';
import DiscreteSlider from '../forms/DiscreteSlider';

export interface WorldParameters {
  [key: string]: string | number;
  name: string;
  seed: string;
  width: number;
  height: number;
  temperature: number;
  moisture: number;
  continentalness: number;
  erosion: number;
  weirdness: number;
  mountainousness: number;
  jaggedness: number;
  waterLevel: number;
}

interface WorldParametersFormProps {
  onSubmit: (params: WorldParameters) => void;
  loading?: boolean;
}

// Slider configurations
const TEMPERATURE_MARKS = [
  { value: -1, label: 'Frozen', description: 'Extreme cold, icy terrain' },
  { value: -0.5, label: 'Cold', description: 'Cool temperatures, snow common' },
  { value: 0, label: 'Mild', description: 'Temperate climate, balanced' },
  { value: 0.5, label: 'Warm', description: 'Warmer regions, less snow' },
  { value: 1, label: 'Hot', description: 'Extreme heat, desert-like' },
];

const MOISTURE_MARKS = [
  { value: -1, label: 'Arid', description: 'Very dry, desert biomes' },
  { value: -0.5, label: 'Dry', description: 'Low rainfall, sparse vegetation' },
  { value: 0, label: 'Moderate', description: 'Balanced humidity' },
  { value: 0.5, label: 'Humid', description: 'High rainfall, lush growth' },
  { value: 1, label: 'Wet', description: 'Very wet, swamps and jungles' },
];

const CONTINENTALNESS_MARKS = [
  { value: -1, label: 'Ocean', description: 'Deep ocean coverage' },
  { value: -0.5, label: 'Coast', description: 'Coastal regions, islands' },
  { value: 0, label: 'Mixed', description: 'Balance of land and water' },
  { value: 0.5, label: 'Land', description: 'More landmass' },
  { value: 1, label: 'Inland', description: 'Large continents' },
];

const EROSION_MARKS = [
  { value: -1, label: 'Smooth', description: 'Flat, eroded terrain' },
  { value: -0.5, label: 'Gentle', description: 'Rolling hills' },
  { value: 0, label: 'Moderate', description: 'Varied elevation' },
  { value: 0.5, label: 'Rough', description: 'Sharp elevation changes' },
  { value: 1, label: 'Extreme', description: 'Deep valleys, high peaks' },
];

const WEIRDNESS_MARKS = [
  { value: -1, label: 'Normal', description: 'Standard terrain patterns' },
  { value: -0.5, label: 'Subtle', description: 'Slight variations' },
  { value: 0, label: 'Moderate', description: 'Some unusual features' },
  { value: 0.5, label: 'Strange', description: 'Unusual formations' },
  { value: 1, label: 'Bizarre', description: 'Extremely alien terrain' },
];

const MOUNTAIN_MARKS = [
  { value: 0.2, label: 'Flat', description: 'Minimal elevation change' },
  { value: 0.5, label: 'Low', description: 'Gentle hills' },
  { value: 1.0, label: 'Medium', description: 'Standard mountains' },
  { value: 1.5, label: 'High', description: 'Tall peaks' },
  { value: 2.0, label: 'Extreme', description: 'Towering mountains' },
];

const JAGGEDNESS_MARKS = [
  { value: 0.2, label: 'Smooth', description: 'Rounded terrain' },
  { value: 0.5, label: 'Soft', description: 'Gentle slopes' },
  { value: 1.0, label: 'Medium', description: 'Mixed terrain' },
  { value: 1.5, label: 'Rough', description: 'Sharp features' },
  { value: 2.0, label: 'Jagged', description: 'Extreme spikes' },
];

const WATER_MARKS = [
  { value: -0.3, label: 'Low', description: 'More land exposed' },
  { value: -0.2, label: 'Below', description: 'Lower sea level' },
  { value: -0.1, label: 'Normal', description: 'Standard sea level' },
  { value: 0, label: 'Above', description: 'Higher sea level' },
  { value: 0.1, label: 'High', description: 'More water coverage' },
];

function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function WorldParametersForm({ onSubmit, loading = false }: WorldParametersFormProps) {
  const [params, setParams] = useState<WorldParameters>({
    name: '',
    seed: generateSeed(),
    width: 256,
    height: 256,
    temperature: 0,
    moisture: 0,
    continentalness: 0,
    erosion: 0,
    weirdness: 0,
    mountainousness: 1.0,
    jaggedness: 1.0,
    waterLevel: -0.1,
  });

  const updateParam = <K extends keyof WorldParameters>(key: K, value: WorldParameters[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (params.name.trim()) {
      onSubmit(params);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Parameters */}
      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Basic Settings</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name" className="text-shadow-200">
              World Name *
            </Label>
            <Input
              id="name"
              value={params.name}
              onChange={(e) => updateParam('name', e.target.value)}
              placeholder="My Procedural World"
              className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="seed" className="text-shadow-200">
              Seed
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="seed"
                value={params.seed}
                onChange={(e) => updateParam('seed', e.target.value)}
                placeholder="random-seed"
                className="border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                disabled={loading}
              />
              <Button
                type="button"
                onClick={() => updateParam('seed', generateSeed())}
                variant="ghost"
                size="sm"
                className="text-accent hover:text-accent/80"
                disabled={loading}
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="width" className="text-shadow-200">
              Width (chunks)
            </Label>
            <Input
              id="width"
              type="number"
              value={params.width}
              onChange={(e) => updateParam('width', Number(e.target.value))}
              min={64}
              max={1024}
              step={32}
              className="mt-1 border-midnight-500 bg-midnight-800/50 text-white"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="height" className="text-shadow-200">
              Height (chunks)
            </Label>
            <Input
              id="height"
              type="number"
              value={params.height}
              onChange={(e) => updateParam('height', Number(e.target.value))}
              min={64}
              max={1024}
              step={32}
              className="mt-1 border-midnight-500 bg-midnight-800/50 text-white"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Climate Parameters */}
      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 p-6">
        <h3 className="mb-6 text-lg font-semibold text-white">Climate</h3>

        <div className="space-y-6">
          <DiscreteSlider
            id="temperature"
            label="Temperature"
            value={params.temperature}
            onChange={(v) => updateParam('temperature', v)}
            marks={TEMPERATURE_MARKS}
          />

          <DiscreteSlider
            id="moisture"
            label="Moisture"
            value={params.moisture}
            onChange={(v) => updateParam('moisture', v)}
            marks={MOISTURE_MARKS}
          />

          <DiscreteSlider
            id="continentalness"
            label="Continentalness"
            value={params.continentalness}
            onChange={(v) => updateParam('continentalness', v)}
            marks={CONTINENTALNESS_MARKS}
          />

          <DiscreteSlider
            id="erosion"
            label="Erosion"
            value={params.erosion}
            onChange={(v) => updateParam('erosion', v)}
            marks={EROSION_MARKS}
          />

          <DiscreteSlider
            id="weirdness"
            label="Weirdness"
            value={params.weirdness}
            onChange={(v) => updateParam('weirdness', v)}
            marks={WEIRDNESS_MARKS}
          />
        </div>
      </div>

      {/* Terrain Parameters */}
      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60 p-6">
        <h3 className="mb-6 text-lg font-semibold text-white">Terrain</h3>

        <div className="space-y-6">
          <DiscreteSlider
            id="mountainousness"
            label="Mountainousness"
            value={params.mountainousness}
            onChange={(v) => updateParam('mountainousness', v)}
            marks={MOUNTAIN_MARKS}
          />

          <DiscreteSlider
            id="jaggedness"
            label="Jaggedness"
            value={params.jaggedness}
            onChange={(v) => updateParam('jaggedness', v)}
            marks={JAGGEDNESS_MARKS}
          />

          <DiscreteSlider
            id="waterLevel"
            label="Water Level"
            value={params.waterLevel}
            onChange={(v) => updateParam('waterLevel', v)}
            marks={WATER_MARKS}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-accent text-white hover:bg-accent/90"
        disabled={loading || !params.name.trim()}
      >
        {loading ? 'Generating World...' : 'Generate World'}
      </Button>
    </form>
  );
}
