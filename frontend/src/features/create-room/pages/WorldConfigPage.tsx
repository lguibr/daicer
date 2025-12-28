import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorldConfigForm } from '@/features/debug/components/WorldConfigForm';
import type { WorldConfig } from '@/features/debug/utils/types';
import { createRoom } from '@/services/api';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useWizard } from '../context/WizardContext';
import { WorldPreview } from '../components/WorldPreview';

export default function WorldConfigPage() {
  const { settings, setSettings } = useWizard();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config: WorldConfig = {
    seed: settings.seed || 'default-seed',
    chunkSize: settings.chunkSize ?? 32,
    globalScale: settings.globalScale ?? 0.01,
    seaLevel: settings.seaLevel ?? 0,
    elevationScale: settings.elevationScale ?? 1,
    roughness: settings.roughness ?? 0.5,
    detail: settings.detail ?? 4,
    moistureScale: settings.moistureScale ?? 1,
    temperatureOffset: settings.temperatureOffset ?? 0,
    structureChance: settings.structureChance ?? 0.1,
    structureSpacing: settings.structureSpacing ?? 10,
    structureSizeAvg: settings.structureSizeAvg ?? 10,
    roadDensity: settings.roadDensity ?? 0.5,
    fogRadius: settings.fogRadius ?? 10,
  };

  const handleConfigChange = (newConfig: WorldConfig) => {
    setSettings((prev) => ({ ...prev, ...newConfig }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const room = await createRoom({
        settings,
        structures: [],
      });

      // Check for debug target
      const searchParams = new URLSearchParams(location.search);
      const isDebug = searchParams.get('target') === 'debug';

      if (isDebug) {
        navigate(`/debug/${room.documentId || room.id}`);
      } else {
        // Proceed to Character Selection
        navigate(`/create/character-selection/${room.documentId || room.id}`, {
          state: {
            initialSeed: settings.seed,
            initialStructures: [],
            initialSettings: settings,
          },
        });
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to create room: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="space-y-2 mb-6 text-center">
        <h2 className="font-display text-lg uppercase tracking-[0.35em] text-aurora-300">World Configuration</h2>
        <p className="text-sm text-shadow-300">Fine-tune the physical parameters of the world generation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Preview */}
        <div className="lg:col-span-8 order-2 lg:order-1 h-[400px] lg:h-[500px] bg-midnight-950/30 rounded-2xl border border-midnight-700/50 backdrop-blur-sm p-1 shadow-2xl relative">
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <WorldPreview config={config} />
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <section className="card p-6 border border-midnight-700/50 bg-midnight-900/40 backdrop-blur-sm h-full max-h-[500px] overflow-y-auto">
            <WorldConfigForm
              config={config}
              isActive
              onConfigChange={handleConfigChange}
              onRegenerate={() => {
                handleConfigChange({
                  ...config,
                  seed: Math.random().toString(36).substr(2, 6),
                });
              }}
            />
          </section>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-midnight-800">
        <button onClick={() => navigate('/create/dm-settings')} className="btn-secondary min-w-[150px]">
          Back
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary min-w-[200px]">
          Forging World
        </button>
      </div>

      {isSubmitting && <LoadingOverlay message="Forging World..." />}
    </div>
  );
}
