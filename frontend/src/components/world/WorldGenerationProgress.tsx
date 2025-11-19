/**
 * WorldGenerationProgress Component
 * Rich UI for real-time world generation with typewriter effect,
 * progress bars, and animated timeline
 */

import { useEffect, useState } from 'react';
import { Clock, Landmark, Map, Route, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useWorldGeneration } from '@/hooks/useWorldGeneration';

interface WorldGenerationProgressProps {
  roomId: string;
  onComplete?: () => void;
}

/**
 * Typewriter effect component
 */
function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [text, currentIndex, speed]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="font-serif text-sm text-ink-primary dark:text-parchment-light">
      {displayedText}
      {currentIndex < text.length && <span className="animate-pulse">█</span>}
    </div>
  );
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
export function WorldGenerationProgress({ roomId, onComplete }: WorldGenerationProgressProps) {
  const genState = useWorldGeneration(roomId);

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
          <p className="text-sm text-shadow-300">{genState.currentStep}</p>
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
            <div className="text-xl font-bold text-parchment-light">{genState.historyPeriods}</div>
            <div className="text-xs text-shadow-400">Eras</div>
          </div>
          <div className="text-center p-3 bg-midnight-950/50 rounded-lg border border-shadow-800/50">
            <Landmark className="w-5 h-5 mx-auto mb-1 text-gilded-gold" />
            <div className="text-xl font-bold text-parchment-light">{genState.structuresPlaced}</div>
            <div className="text-xs text-shadow-400">Structures</div>
          </div>
          <div className="text-center p-3 bg-midnight-950/50 rounded-lg border border-shadow-800/50">
            <Route className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-xl font-bold text-parchment-light">{genState.roadsGenerated}</div>
            <div className="text-xs text-shadow-400">Roads</div>
          </div>
        </div>

        {/* World Description with Typewriter Effect */}
        {genState.worldText && (
          <div className="p-4 bg-midnight-950/50 rounded-lg border border-shadow-800/50 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-accent mb-2">World Description:</h3>
            <TypewriterText text={genState.worldText} speed={10} />
          </div>
        )}

        {/* Error State */}
        {genState.error && (
          <div className="p-4 bg-crimson-red/10 border border-crimson-red/30 rounded-lg">
            <p className="text-sm text-crimson-red">{genState.error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
