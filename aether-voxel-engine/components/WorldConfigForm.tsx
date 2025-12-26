import React, { useState } from 'react';
import { WorldConfig } from '../aether';

interface Props {
  config: WorldConfig;
  onConfigChange: (newConfig: WorldConfig) => void;
  onRegenerate: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-700 rounded bg-slate-800/50 mb-2 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex justify-between"
            >
                {title}
                <span>{isOpen ? '-' : '+'}</span>
            </button>
            {isOpen && <div className="p-3 space-y-3">{children}</div>}
        </div>
    );
};

const RangeControl: React.FC<{ 
    label: string; 
    value: number; 
    min: number; 
    max: number; 
    step: number; 
    onChange: (val: number) => void;
    format?: (val: number) => string; 
}> = ({ label, value, min, max, step, onChange, format }) => (
    <div>
        <div className="flex justify-between text-slate-400 text-[10px] mb-1">
            <label>{label}</label>
            <span className="text-slate-200">{format ? format(value) : value.toFixed(2)}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-sky-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

export const WorldConfigForm: React.FC<Props> = ({ config, onConfigChange, onRegenerate }) => {
  const handleChange = (key: keyof WorldConfig, value: string | number) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="mb-4 text-xs font-mono max-h-[60vh] overflow-y-auto pr-1">
      <div className="mb-3">
        <label className="text-slate-400 text-[10px] block mb-1">SEED ID</label>
        <div className="flex gap-2">
            <input 
                type="text" 
                value={config.seed}
                onChange={(e) => handleChange('seed', e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white w-full font-mono text-xs"
            />
            <button onClick={() => handleChange('seed', Math.random().toString(36).substring(7))} className="bg-slate-700 px-2 rounded">🎲</button>
        </div>
      </div>

      <Section title="TERRAIN & NOISE" defaultOpen={true}>
         <RangeControl label="Global Scale" value={config.globalScale} min={0.5} max={5.0} step={0.1} onChange={(v) => handleChange('globalScale', v)} />
         <RangeControl label="Sea Level" value={config.seaLevel} min={-0.8} max={0.8} step={0.05} onChange={(v) => handleChange('seaLevel', v)} />
         <RangeControl label="Elevation Impact" value={config.elevationScale} min={0.001} max={0.05} step={0.001} onChange={(v) => handleChange('elevationScale', v)} />
         <RangeControl label="Roughness" value={config.roughness} min={0.0} max={1.0} step={0.05} onChange={(v) => handleChange('roughness', v)} />
         <RangeControl label="Detail (Octaves)" value={config.detail} min={1} max={6} step={1} onChange={(v) => handleChange('detail', v)} format={(v) => v.toFixed(0)} />
      </Section>

      <Section title="BIOMES & CLIMATE">
         <RangeControl label="Moisture Scale" value={config.moistureScale} min={0.001} max={0.05} step={0.001} onChange={(v) => handleChange('moistureScale', v)} />
         <RangeControl label="Temp. Offset" value={config.temperatureOffset} min={-1.0} max={1.0} step={0.1} onChange={(v) => handleChange('temperatureOffset', v)} />
      </Section>

      <Section title="CIVILIZATION">
         <RangeControl label="Structure Chance" value={config.structureChance} min={0} max={1} step={0.05} onChange={(v) => handleChange('structureChance', v)} format={(v) => `${(v*100).toFixed(0)}%`} />
         <RangeControl label="Spacing (Sparsity)" value={config.structureSpacing} min={1} max={10} step={1} onChange={(v) => handleChange('structureSpacing', v)} format={(v) => `${v} chunks`} />
         <RangeControl label="Avg Size" value={config.structureSizeAvg} min={5} max={20} step={1} onChange={(v) => handleChange('structureSizeAvg', v)} format={(v) => `${v} tiles`} />
         <RangeControl label="Road Density" value={config.roadDensity} min={0} max={1} step={0.05} onChange={(v) => handleChange('roadDensity', v)} />
      </Section>

      <Section title="GAMEPLAY">
         <RangeControl label="Fog Radius" value={config.fogRadius} min={5} max={40} step={1} onChange={(v) => handleChange('fogRadius', v)} format={(v) => `${v} tiles`} />
      </Section>

      <button 
        onClick={onRegenerate}
        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded mt-2 transition-colors border-b-4 border-sky-800 active:border-b-0 active:translate-y-1 shadow-lg"
      >
        REGENERATE WORLD
      </button>
    </div>
  );
};