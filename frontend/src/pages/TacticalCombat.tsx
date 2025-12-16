/**
 * @file frontend/src/pages/TacticalCombat.tsx
 * @description Main tactical combat page - orchestration only
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { useTacticalEncounter } from '../hooks/useTacticalEncounter';
import { useTacticalActions } from '../hooks/useTacticalActions';
import * as tacticalApi from '../services/tacticalApi';
import type { ArenaInfo } from '../components/tactical/types';
import { ArenaSelector } from '../components/tactical/ArenaSelector';
import { TacticalArena } from '../components/tactical/TacticalArena';
import { UnitRoster } from '../components/tactical/UnitRoster';
import { CommandInput } from '../components/tactical/CommandInput';
import { TacticalLog } from '../components/tactical/TacticalLog';
import { ActionPreviewModal } from '../components/tactical/ActionPreviewModal';
import { Button } from '../components/ui/button';

export function TacticalCombat() {
  const navigate = useNavigate();

  // Local state
  const [arenas, setArenas] = useState<ArenaInfo[]>([]);
  const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Hooks
  const { encounter, loading, error, removeUnit, startCombat, refresh } = useTacticalEncounter(encounterId);
  const {
    command,
    setCommand,
    preview,
    submitting,
    executing,
    error: actionError,
    submitCommand,
    executeAction,
    clearPreview,
  } = useTacticalActions(encounterId);

  // Load arenas on mount
  useEffect(() => {
    tacticalApi.listArenas().then(setArenas).catch(console.error);
  }, []);

  // Show modal when preview is ready
  useEffect(() => {
    if (preview) {
      setShowPreviewModal(true);
    }
  }, [preview]);

  // Create encounter
  const handleCreateEncounter = async () => {
    if (!selectedArenaId) return;

    try {
      const newEncounter = await tacticalApi.createEncounter(selectedArenaId, 'Tactical Combat');
      setEncounterId(newEncounter.id);
    } catch (err) {
      console.error('Failed to create encounter:', err);
    }
  };

  // Handle action execution
  const handleExecuteAction = async () => {
    await executeAction();
    setShowPreviewModal(false);
    refresh(); // Refresh encounter state
  };

  // Handle preview close
  const handleClosePreview = () => {
    setShowPreviewModal(false);
    clearPreview();
  };

  // Render arena selection
  if (!encounterId) {
    return (
      <div className="min-h-screen bg-midnight-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display uppercase tracking-wider text-aurora-100 mb-2">Tactical Combat</h1>
              <p className="text-shadow-300">Select an arena to begin your tactical encounter</p>
            </div>
            <Button onClick={() => navigate('/gameplay')} variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Gameplay
            </Button>
          </div>

          <ArenaSelector arenas={arenas} selectedArenaId={selectedArenaId} onSelect={setSelectedArenaId} />

          <div className="mt-8 text-center">
            <Button
              onClick={handleCreateEncounter}
              disabled={!selectedArenaId}
              size="lg"
              className="bg-aurora-500 hover:bg-aurora-400"
            >
              Create Encounter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render main combat view
  return (
    <div className="min-h-screen bg-midnight-950 p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display uppercase tracking-wider text-aurora-100">Tactical Combat</h1>
            {encounter && (
              <p className="text-sm text-shadow-300">
                Round {encounter.round} | Phase: {encounter.phase}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {encounter && encounter.phase === 'setup' && (
              <Button
                onClick={startCombat}
                disabled={encounter.units.length === 0 || loading}
                className="bg-green-600 hover:bg-green-500 gap-2"
              >
                <Play className="h-4 w-4" />
                Start Combat
              </Button>
            )}
            <Button onClick={() => setEncounterId(null)} variant="ghost">
              New Encounter
            </Button>
          </div>
        </div>

        {/* Error display */}
        {(error || actionError) && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded text-red-300 text-sm">
            {error || actionError}
          </div>
        )}

        {/* Main grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Left: Arena and Command Input */}
          <div className="space-y-4">
            {encounter && arenas.length > 0 && (
              <TacticalArena
                width={arenas.find((a) => a.id === encounter.arenaId)?.gridWidth || 15}
                height={arenas.find((a) => a.id === encounter.arenaId)?.gridHeight || 15}
                cells={[]}
                units={encounter.units}
                selectedUnitId={selectedUnitId}
                activeUnitId={encounter.activeUnitId}
                onUnitClick={setSelectedUnitId}
              />
            )}

            {encounter && encounter.phase !== 'setup' && (
              <CommandInput
                value={command}
                onChange={setCommand}
                onSubmit={submitCommand}
                submitting={submitting}
                disabled={loading || submitting || executing}
                suggestions={preview?.suggestions}
              />
            )}
          </div>

          {/* Right: Unit Roster and Log */}
          <div className="space-y-4">
            {encounter && (
              <>
                <UnitRoster
                  units={encounter.units}
                  activeUnitId={encounter.activeUnitId}
                  selectedUnitId={selectedUnitId}
                  onUnitClick={setSelectedUnitId}
                  phase={encounter.phase}
                  onRemoveUnit={removeUnit}
                />
                <TacticalLog entries={encounter.log} maxHeight="400px" />
              </>
            )}
          </div>
        </div>

        {/* Action Preview Modal */}
        {preview && (
          <ActionPreviewModal
            isOpen={showPreviewModal}
            onClose={handleClosePreview}
            onConfirm={handleExecuteAction}
            preview={{
              id: preview.planId,
              commandText: command,
              parsed: preview.parsed,
              validation: preview.validation,
              preview: {
                movementPath: preview.preview.movementPath,
                affectedUnits: preview.preview.affectedUnits.map((u: any) => ({
                  unitId: u.id,
                  effect: u.effect,
                  predictedDamage: u.predictedDamage,
                })),
                diceNeeded: preview.preview.diceNeeded,
                resourceCost: preview.preview.resourceCost,
                hitChance: preview.preview.hitChance,
              },
            }}
            loading={executing}
          />
        )}
      </div>
    </div>
  );
}
