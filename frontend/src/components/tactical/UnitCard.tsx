/**
 * @file frontend/src/components/tactical/UnitCard.tsx
 * @description Individual unit display card
 */

import { X } from 'lucide-react';
import type { TacticalUnit } from './types';
import { Button } from '../ui/button';

interface UnitCardProps {
  unit: TacticalUnit;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

export function UnitCard({ unit, isActive, isSelected, onClick, onRemove }: UnitCardProps) {
  const hpPercentage = (unit.hp / unit.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div
      role="button"
      tabIndex={0}
      className={`
        p-3 rounded-lg border transition-all cursor-pointer relative
        ${isActive ? 'border-nebula-400 bg-nebula-900/20' : 'border-shadow-700 bg-midnight-300'}
        ${isSelected ? 'ring-2 ring-aurora-400' : ''}
        ${unit.hp <= 0 ? 'opacity-50 grayscale' : ''}
        hover:bg-shadow-800/50
      `}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Remove button */}
      {onRemove && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            unit.isPlayer ? 'bg-aurora-500 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {unit.avatar || unit.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-shadow-50">{unit.name}</div>
          <div className="text-xs text-shadow-400">
            Init: {unit.initiative} | AC: {unit.armorClass}
          </div>
        </div>
        {isActive && <div className="text-xs font-bold text-nebula-300 px-2 py-1 bg-nebula-900/50 rounded">ACTIVE</div>}
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-shadow-300 mb-1">
          <span>HP</span>
          <span>
            {unit.hp}/{unit.maxHp}
          </span>
        </div>
        <div className="w-full bg-shadow-800 rounded-full h-2">
          <div
            className={`${hpColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.max(0, hpPercentage)}%` }}
          />
        </div>
      </div>

      {/* Status */}
      {isActive && (
        <div className="flex gap-1 text-xs mb-2">
          <div
            className={`px-2 py-1 rounded ${unit.hasMoved ? 'bg-shadow-700 text-shadow-400' : 'bg-green-900/50 text-green-300'}`}
          >
            {unit.hasMoved ? '✓' : '○'} Move
          </div>
          <div
            className={`px-2 py-1 rounded ${unit.hasActed ? 'bg-shadow-700 text-shadow-400' : 'bg-green-900/50 text-green-300'}`}
          >
            {unit.hasActed ? '✓' : '○'} Act
          </div>
        </div>
      )}

      {/* Conditions */}
      {unit.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unit.conditions.map((condition, idx) => (
            <div key={idx} className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded border border-red-700">
              {condition}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
