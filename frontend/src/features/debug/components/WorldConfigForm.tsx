import React from 'react';
import type { WorldConfig } from '../utils/types';
import { RefreshCw, RotateCcw } from 'lucide-react';

interface WorldConfigProps {
  config: WorldConfig;
  isActive: boolean;
  onConfigChange: (config: WorldConfig) => void;
  onRegenerate: () => void;
}

const SliderParams = [
  {
    group: 'Terrain & Noise',
    params: [
      { key: 'globalScale', label: 'Global Scale', min: 0.001, max: 0.1, step: 0.001 },
      { key: 'seaLevel', label: 'Sea Level', min: -1, max: 1, step: 0.05 },
      { key: 'elevationScale', label: 'Elevation Impact', min: 0.01, max: 10, step: 0.01 },
      { key: 'roughness', label: 'Roughness', min: 0, max: 1, step: 0.05 },
      { key: 'detail', label: 'Detail (Octaves)', min: 1, max: 8, step: 1 },
    ],
  },
  {
    group: 'Biomes & Climate',
    params: [
      { key: 'moistureScale', label: 'Moisture Scale', min: 0.001, max: 0.1, step: 0.001 },
      { key: 'temperatureOffset', label: 'Temp. Offset', min: -1, max: 1, step: 0.05 },
    ],
  },
  {
    group: 'Civilization',
    params: [
      {
        key: 'structureChance',
        label: 'Structure Chance',
        min: 0,
        max: 1,
        step: 0.05,
        format: (v: number) => `${Math.round(v * 100)}%`,
      },
      { key: 'structureSpacing', label: 'Spacing (Sparsity)', min: 1, max: 20, step: 1, suffix: ' chunks' },
      { key: 'structureSizeAvg', label: 'Avg Size', min: 5, max: 30, step: 1, suffix: ' tiles' },
      { key: 'roadDensity', label: 'Road Density', min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    group: 'Gameplay',
    params: [{ key: 'fogRadius', label: 'Fog Radius', min: 5, max: 50, step: 1, suffix: ' tiles' }],
  },
];

export const WorldConfigForm: React.FC<WorldConfigProps> = ({ config, isActive, onConfigChange, onRegenerate }) => {
  const handleChange = (key: keyof WorldConfig, value: number | string) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Seed */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">SEED ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={config.seed}
            onChange={(e) => handleChange('seed', e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleChange('seed', Math.random().toString(36).substr(2, 6))}
            className="p-1 bg-neutral-700 hover:bg-neutral-600 rounded"
          >
            <RotateCcw className="w-4 h-4 text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Dynamic Sliders */}
      {SliderParams.map((group) => (
        <div key={group.group} className="space-y-3 pt-2">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-700 pb-1">
            {group.group}
          </h2>
          {group.params.map((p) => {
            const val = config[p.key as keyof WorldConfig] as number;
            return (
              <div key={p.key} className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>{p.label}</span>
                  <span className="font-mono text-blue-400">
                    {p.format ? p.format(val) : val}
                    {p.suffix || ''}
                  </span>
                </div>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={val}
                  onChange={(e) => handleChange(p.key as keyof WorldConfig, parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      ))}

      {/* Regenerate Button */}
      <button
        onClick={onRegenerate}
        className={clsx(
          'w-full py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mt-4',
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
            : 'bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-50'
        )}
      >
        <RefreshCw className={clsx('w-4 h-4', !isActive && 'animate-spin')} />
        {isActive ? 'Regenerate World' : 'Rendering...'}
      </button>
    </div>
  );
};

// Helper for conditional classes
function clsx(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
