/**
 * WorldGenerationProgress Component
 * Rich UI for real-time world generation with typewriter effect,
 * progress bars, and animated timeline
 */

import { useEffect } from 'react';
import { Clock, Landmark, Map, Route, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useWorldGeneration } from '@/hooks/useWorldGeneration';

interface WorldGenerationProgressProps {
  roomId: string;
  onComplete?: () => void;
}

/**
 * Timeline era indicator
 */
function TimelineEra({ active, complete, label }: { active: boolean; complete: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {complete ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : active ? (
        <Loader2 className="w-4 h-4 animate-spin text-accent" />
      ) : (
        <Circle className="w-4 h-4 text-shadow-600" />
      )}
      <span
        className={`text-sm ${complete || active ? 'text-ink-primary dark:text-parchment-light' : 'text-ink-tertiary dark:text-parchment-dark'}`}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Main WorldGenerationProgress component
 */
export function WorldGenerationProgress({ onComplete }: Omit<WorldGenerationProgressProps, 'roomId'>) {
  const genState = useWorldGeneration();

  // Derived state
  const currentStepName =
    genState.steps.find((s) => !s.completed)?.name || (genState.progress >= 100 ? 'Complete' : 'Initializing');
  const structuresCount = genState.structures ? genState.structures.length : 0;

  // Call onComplete when generation finishes
  useEffect(() => {
    if (genState.progress === 100 && !genState.isGenerating) {
      onComplete?.();
    }
  }, [genState.progress, genState.isGenerating, onComplete]);

  if (!genState.isGenerating && genState.progress === 0) {
    return null;
  }

  const steps = [
    { label: 'Initializing', threshold: 10 },
    { label: 'Generating History', threshold: 40 },
    { label: 'Placing Structures', threshold: 60 },
    { label: 'Creating Roads', threshold: 75 },
    { label: 'Finalizing World', threshold: 85 },
    { label: 'Complete', threshold: 100 },
  ];

  const currentStepIndex = steps.findIndex((s) => genState.progress < s.threshold);
  const activeStep = currentStepIndex === -1 ? steps.length - 1 : Math.max(0, currentStepIndex - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/95 backdrop-blur-sm">
      <Card className="max-w-3xl w-full mx-4 p-6 space-y-6 bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-700 border-accent/30 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold text-parchment-light mb-2 flex items-center justify-center gap-2">
            <Map className="w-6 h-6 text-accent" />
            World Generation in Progress
          </h2>
          <p className="text-sm text-shadow-300">{currentStepName}</p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-shadow-400">Progress</span>
            <span className="font-semibold text-accent">{Math.round(genState.progress)}%</span>
          </div>
          <div className="w-full h-3 bg-midnight-950 rounded-full overflow-hidden border border-accent/20">
            <div
              className="h-full bg-gradient-to-r from-accent via-aurora-blue to-accent transition-all duration-500 ease-out relative"
              style={{ width: `${genState.progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="grid grid-cols-2 gap-2 p-4 bg-midnight-950/50 rounded-lg border border-shadow-800/50">
          {steps.map((step, index) => (
            <TimelineEra
              key={step.label}
              label={step.label}
              active={index === activeStep}
              complete={index < activeStep}
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-midnight-950/50 rounded-lg border border-shadow-800/50">
            <Clock className="w-5 h-5 mx-auto mb-1 text-aurora-blue" />
            <div className="text-xl font-bold text-parchment-light">4</div>
            <div className="text-xs text-shadow-400">Eras</div>
          </div>
          <div className="text-center p-3 bg-midnight-950/50 rounded-lg border border-shadow-800/50">
            <Landmark className="w-5 h-5 mx-auto mb-1 text-gilded-gold" />
            <div className="text-xl font-bold text-parchment-light">{structuresCount}</div>
            <div className="text-xs text-shadow-400">Structures</div>
          </div>
          <div className="text-center p-3 bg-midnight-950/50 rounded-lg border border-shadow-800/50">
            <Route className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-xl font-bold text-parchment-light">12</div>
            <div className="text-xs text-shadow-400">Roads</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
