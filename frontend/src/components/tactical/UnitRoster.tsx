/**
 * @file frontend/src/components/tactical/UnitRoster.tsx
 * @description List of all units in tactical encounter
 */

import { Plus } from 'lucide-react';
import type { TacticalUnit } from './types';
import { UnitCard } from './UnitCard';
import { Button } from '../ui/button';

interface UnitRosterProps {
  units: TacticalUnit[];
  activeUnitId: string | null;
  selectedUnitId: string | null;
  onUnitClick: (unitId: string) => void;
  onAddUnit?: () => void;
  onRemoveUnit?: (unitId: string) => void;
  phase: 'setup' | 'initiative' | 'in_progress' | 'complete';
}

export function UnitRoster({
  units,
  activeUnitId,
  selectedUnitId,
  onUnitClick,
  onAddUnit,
  onRemoveUnit,
  phase,
}: UnitRosterProps) {
  const playerUnits = units.filter((u) => u.allegiance === 'player');
  const enemyUnits = units.filter((u) => u.allegiance === 'enemy');
  const neutralUnits = units.filter((u) => u.allegiance === 'neutral');

  return (
    <div className="bg-midnight-800 rounded-lg border border-shadow-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-shadow-50">Units</h3>
        {phase === 'setup' && onAddUnit && (
          <Button onClick={onAddUnit} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        )}
      </div>

      {/* Player Units */}
      {playerUnits.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-aurora-300 mb-2">Players</h4>
          <div className="space-y-2">
            {playerUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isActive={unit.id === activeUnitId}
                isSelected={unit.id === selectedUnitId}
                onClick={() => onUnitClick(unit.id)}
                onRemove={phase === 'setup' && onRemoveUnit ? () => onRemoveUnit(unit.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enemy Units */}
      {enemyUnits.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-2">Enemies</h4>
          <div className="space-y-2">
            {enemyUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isActive={unit.id === activeUnitId}
                isSelected={unit.id === selectedUnitId}
                onClick={() => onUnitClick(unit.id)}
                onRemove={phase === 'setup' && onRemoveUnit ? () => onRemoveUnit(unit.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Neutral Units */}
      {neutralUnits.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Neutral</h4>
          <div className="space-y-2">
            {neutralUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isActive={unit.id === activeUnitId}
                isSelected={unit.id === selectedUnitId}
                onClick={() => onUnitClick(unit.id)}
                onRemove={phase === 'setup' && onRemoveUnit ? () => onRemoveUnit(unit.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {units.length === 0 && (
        <div className="text-center text-shadow-400 text-sm py-8">No units yet. Add some to begin!</div>
      )}
    </div>
  );
}
