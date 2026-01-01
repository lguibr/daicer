// import React from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

import type { WorldConfig } from '../utils/types';

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

export function WorldConfigForm({ config, isActive, onConfigChange, onRegenerate }: WorldConfigProps) {
  const handleChange = (key: keyof WorldConfig, value: number | string) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Seed */}
      <div className="space-y-1">
        <label htmlFor="seed-input" className="text-xs font-bold text-shadow-400 uppercase tracking-wider">
          SEED ID
        </label>
        <div className="flex gap-2">
          <input
            id="seed-input"
            type="text"
            value={config.seed}
            onChange={(e) => handleChange('seed', e.target.value)}
            className="flex-1 bg-midnight-950/50 border border-midnight-700 rounded-lg px-3 py-2 text-sm font-mono text-aurora-300 focus:outline-none focus:border-aurora-500/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => handleChange('seed', Math.random().toString(36).substr(2, 6))}
            className="p-2 bg-midnight-800 hover:bg-midnight-700 border border-midnight-600 rounded-lg transition-colors group"
            title="Randomize Seed"
          >
            <RotateCcw className="w-4 h-4 text-shadow-300 group-hover:text-aurora-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Dynamic Sliders */}
      <div className="space-y-6 pt-2">
        {SliderParams.map((group) => (
          <div key={group.group} className="space-y-4">
            <h2 className="text-[10px] font-black text-aurora-500/80 uppercase tracking-widest border-b border-aurora-500/20 pb-1">
              {group.group}
            </h2>
            <div className="grid gap-6">
              {group.params.map((p) => {
                const val = config[p.key as keyof WorldConfig] as number;

                // Create dynamic marks for consistent UI feel
                // We'll make start, mid, end marks
                // const range = p.max - p.min;
                // const mid = p.min + range / 2;
                // const marks = [
                //   { value: p.min, label: 'Low' },
                //   { value: mid, label: 'Med' },
                //   { value: p.max, label: 'High' },
                // ];

                return (
                  <div key={p.key}>
                    {/* We use a custom wrapper around input range or potentially reuse DiscreteSlider if suitable.
                       However, DiscreteSlider expects discrete array of marks and snapping.
                       These world params are continuous. Let's build a ContinuousSlider here or style the input nicely.
                   */}

                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-shadow-300 uppercase tracking-wider">{p.label}</span>
                      <span className="font-mono text-aurora-400 text-xs bg-aurora-500/10 px-1.5 py-0.5 rounded border border-aurora-500/20">
                        {p.format ? p.format(val) : val}
                        {p.suffix || ''}
                      </span>
                    </div>

                    <div className="relative h-6 flex items-center">
                      <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1.5 bg-midnight-800 rounded-full overflow-hidden border border-midnight-700">
                        <div
                          className="h-full bg-gradient-to-r from-aurora-900 via-aurora-500 to-aurora-400"
                          style={{ width: `${((val - p.min) / (p.max - p.min)) * 100}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={val}
                        onChange={(e) => handleChange(p.key as keyof WorldConfig, parseFloat(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                      {/* Thumb knob visualization (since input is hidden) */}
                      <div
                        className="pointer-events-none absolute h-4 w-4 rounded-full bg-midnight-950 border-2 border-aurora-400 shadow-[0_0_10px_rgba(122,73,217,0.5)] transition-transform"
                        style={{ left: `calc(${((val - p.min) / (p.max - p.min)) * 100}% - 8px)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Regenerate Button */}
      <button
        type="button"
        onClick={onRegenerate}
        disabled={!isActive}
        className={clsx(
          'w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-6 border',
          isActive
            ? 'bg-aurora-600 hover:bg-aurora-500 text-white border-aurora-400 shadow-[0_0_20px_rgba(122,73,217,0.3)] hover:shadow-[0_0_30px_rgba(122,73,217,0.5)] active:scale-[0.98]'
            : 'bg-midnight-800 text-midnight-500 border-midnight-700 cursor-not-allowed'
        )}
      >
        <RefreshCw className={clsx('w-4 h-4', !isActive && 'animate-spin')} />
        {isActive ? 'Regenerate World' : 'Forging...'}
      </button>
    </div>
  );
}
