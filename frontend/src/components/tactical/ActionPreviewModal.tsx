/**
 * @file frontend/src/components/tactical/ActionPreviewModal.tsx
 * @description Modal for previewing tactical combat actions before execution
 */

import { Modal } from '../ui/modal';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import type { ActionPlan } from './types';

export interface ActionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  preview: ActionPlan | null;
  loading?: boolean;
}

export function ActionPreviewModal({ isOpen, onClose, onConfirm, preview, loading = false }: ActionPreviewModalProps) {
  if (!preview) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Action Preview" maxWidth="xl">
      {/* Command Interpretation */}
      <Card className="mb-4 bg-midnight-800 border-aurora-400/20">
        <CardHeader>
          <CardTitle>Command</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-shadow-100">{preview.commandText}</p>
          <p className="text-xs text-shadow-400 mt-2">
            Parsed as: {preview.parsed.intent}
            {preview.parsed.target?.unitName && ` targeting ${preview.parsed.target.unitName}`}
          </p>
        </CardContent>
      </Card>

      {/* Movement Path Visualization */}
      {preview.preview.movementPath && preview.preview.movementPath.length > 0 && (
        <Card className="mb-4 bg-midnight-800/70 border-aurora-300/20">
          <CardHeader>
            <CardTitle>Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-shadow-200">
              <p>Path length: {preview.preview.movementPath.length} squares</p>
              <p className="text-xs text-shadow-400 mt-1">
                Route:{' '}
                {preview.preview.movementPath
                  .map((p) => `(${p.x},${p.y})`)
                  .slice(0, 5)
                  .join(' → ')}
                {preview.preview.movementPath.length > 5 && ' ...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predicted Dice Rolls */}
      {preview.preview.diceNeeded.length > 0 && (
        <Card className="mb-4 bg-midnight-800/70 border-nebula-400/20">
          <CardHeader>
            <CardTitle>Predicted Outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.preview.diceNeeded.map((roll, idx) => (
              <div key={idx} className="flex justify-between items-center bg-shadow-800/50 p-3 rounded">
                <span className="text-sm text-shadow-200">{roll}</span>
                {preview.preview.hitChance !== undefined && idx === 0 && (
                  <span className="text-sm font-bold text-aurora-300">
                    {Math.round(preview.preview.hitChance * 100)}% chance
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Affected Units */}
      {preview.preview.affectedUnits.length > 0 && (
        <Card className="mb-4 bg-midnight-800/70 border-shadow-600/20">
          <CardHeader>
            <CardTitle>Affected Units</CardTitle>
          </CardHeader>
          <CardContent>
            {preview.preview.affectedUnits.map((unit) => (
              <div key={unit.unitId} className="flex justify-between p-2 border-b border-shadow-700 last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-shadow-100">{unit.effect}</p>
                </div>
                {unit.predictedDamage && (
                  <div className="text-right">
                    <p className="text-red-400 text-sm font-bold">~{unit.predictedDamage.avg} damage</p>
                    <p className="text-xs text-shadow-400">
                      ({unit.predictedDamage.min}-{unit.predictedDamage.max})
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resource Cost */}
      {preview.preview.resourceCost && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded p-3 mb-4">
          <p className="text-blue-300 text-sm font-semibold mb-1">💎 Resource Cost</p>
          <p className="text-xs text-blue-200">{preview.preview.resourceCost}</p>
        </div>
      )}

      {/* Warnings */}
      {preview.validation.warnings.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-600/30 rounded p-3 mb-4">
          <p className="text-amber-300 text-sm font-semibold mb-1">⚠️ Warnings</p>
          <ul className="text-xs text-amber-200 space-y-1">
            {preview.validation.warnings.map((w, idx) => (
              <li key={idx}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {preview.validation.errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600/30 rounded p-3 mb-4">
          <p className="text-red-300 text-sm font-semibold mb-1">❌ Errors</p>
          <ul className="text-xs text-red-200 space-y-1">
            {preview.validation.errors.map((e, idx) => (
              <li key={idx}>• {e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button onClick={onClose} variant="ghost" className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="default"
          className="flex-1 bg-aurora-500 hover:bg-aurora-400"
          disabled={!preview.validation.valid || loading}
        >
          {loading ? 'Executing...' : 'Confirm Action'}
        </Button>
      </div>
    </Modal>
  );
}
