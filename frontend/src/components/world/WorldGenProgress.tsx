/**
 * World Generation Progress Component
 * Displays real-time progress of graph-based world generation
 */

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getPhaseDisplayName, type WorldGenPhase } from '@/hooks/useGraphStream';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ProgressBar } from '../ui/progress-bar';

interface WorldGenProgressProps {
  currentPhase?: WorldGenPhase;
  progressPercentage?: number;
  errorMessage?: string;
  isRetrying?: boolean;
  retryCount?: number;
  className?: string;
}

/**
 * World generation progress display
 * Shows current phase, progress bar, and phase history
 */
export function WorldGenProgress({
  currentPhase,
  progressPercentage = 0,
  errorMessage,
  isRetrying = false,
  retryCount = 0,
  className = '',
}: WorldGenProgressProps) {
  const phases: WorldGenPhase[] = [
    'init',
    'conditions',
    'history',
    'structures',
    'roads',
    'terrain',
    'chunks',
    'lore',
    'complete',
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isRetrying ? (
            <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
          ) : currentPhase === 'complete' ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          )}
          World Generation Progress
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{currentPhase ? getPhaseDisplayName(currentPhase) : 'Waiting...'}</span>
            <span className="text-muted-foreground">{progressPercentage}%</span>
          </div>
          <ProgressBar value={progressPercentage} className="h-2" />
        </div>

        {/* Retry Warning */}
        {isRetrying && retryCount > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">Retry attempt {retryCount}/3</p>
              <p className="text-yellow-700 dark:text-yellow-400">{errorMessage || 'An error occurred, retrying...'}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && !isRetrying && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-500" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">Generation failed</p>
              <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Phase Checklist */}
        <div className="space-y-1">
          {phases.map((phase) => {
            const isActive = phase === currentPhase;
            const isComplete = phases.indexOf(phase) < (currentPhase ? phases.indexOf(currentPhase) : -1);

            return (
              <div
                key={phase}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : isComplete
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                ) : (
                  <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-current" />
                )}
                <span>{getPhaseDisplayName(phase)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Period Progress Indicator
 * Shows progress within history generation phase
 */
interface PeriodProgressProps {
  currentPeriod: number;
  totalPeriods: number;
  periodName?: string;
  className?: string;
}

export function PeriodProgress({ currentPeriod, totalPeriods, periodName, className = '' }: PeriodProgressProps) {
  return (
    <div
      className={`rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Generating Period {currentPeriod}/{totalPeriods}
          </p>
          {periodName && <p className="text-xs text-blue-700 dark:text-blue-300">{periodName}</p>}
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
      </div>

      {/* Mini progress bar for periods */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
          style={{ width: `${(currentPeriod / totalPeriods) * 100}%` }}
        />
      </div>
    </div>
  );
}
