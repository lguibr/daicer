/**
 * LayerControls Component
 * Z-level navigation for terrain viewer (-16 to +16)
 * Supports slider, buttons, and keyboard (PgUp/PgDn)
 */

import { useEffect } from 'react';
import { Button } from '../ui/button';

interface LayerControlsProps {
  currentLayer: number; // -16 to +16
  onLayerChange: (z: number) => void;
  min: number;
  max: number;
}

const LAYER_LABELS: Record<number, string> = {
  16: 'High Sky',
  8: 'Sky',
  4: 'Above Ground',
  0: 'Ground Level',
  '-4': 'Shallow Underground',
  '-8': 'Deep Underground',
  '-16': 'Bedrock',
};

function getLayerLabel(z: number): string {
  return LAYER_LABELS[z] || (z > 0 ? 'Above Ground' : z < 0 ? 'Underground' : 'Ground');
}

export function LayerControls({ currentLayer, onLayerChange, min, max }: LayerControlsProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'PageUp' || e.key === 'ArrowUp') {
        e.preventDefault();
        onLayerChange(Math.min(currentLayer + 1, max));
      }
      if (e.key === 'PageDown' || e.key === 'ArrowDown') {
        e.preventDefault();
        onLayerChange(Math.max(currentLayer - 1, min));
      }
      // Home/End for quick navigation
      if (e.key === 'Home') {
        e.preventDefault();
        onLayerChange(0); // Ground level
      }
      if (e.key === 'End') {
        e.preventDefault();
        onLayerChange(max); // Top level
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentLayer, min, max, onLayerChange]);

  return (
    <div className="flex items-center gap-3">
      {/* Down Button */}
      <Button
        onClick={() => onLayerChange(Math.max(currentLayer - 1, min))}
        disabled={currentLayer <= min}
        variant="ghost"
        size="sm"
        className="text-shadow-300 hover:text-white disabled:opacity-30"
        title="Go down one layer (PgDn)"
      >
        ▼ Down
      </Button>

      {/* Slider */}
      <div className="flex flex-col items-center gap-1">
        <input
          type="range"
          min={min}
          max={max}
          value={currentLayer}
          onChange={(e) => onLayerChange(parseInt(e.target.value, 10))}
          className="h-32 w-2 cursor-pointer appearance-none rounded-full bg-midnight-700"
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
          }}
          title={`Z-level: ${currentLayer}`}
        />
      </div>

      {/* Current Level Display */}
      <div className="min-w-24 rounded-lg border border-midnight-600 bg-midnight-800/60 px-3 py-2 text-center">
        <div className="font-mono text-lg font-bold text-accent">
          Z: {currentLayer > 0 ? '+' : ''}
          {currentLayer}
        </div>
        <div className="text-xs text-shadow-400">{getLayerLabel(currentLayer)}</div>
      </div>

      {/* Up Button */}
      <Button
        onClick={() => onLayerChange(Math.min(currentLayer + 1, max))}
        disabled={currentLayer >= max}
        variant="ghost"
        size="sm"
        className="text-shadow-300 hover:text-white disabled:opacity-30"
        title="Go up one layer (PgUp)"
      >
        ▲ Up
      </Button>

      {/* Quick Nav */}
      <div className="ml-2 flex flex-col gap-1">
        <Button
          onClick={() => onLayerChange(0)}
          variant="ghost"
          size="sm"
          className="text-xs text-shadow-400 hover:text-accent"
          title="Return to ground level (Home)"
        >
          Ground
        </Button>
      </div>
    </div>
  );
}
