/**
 * Section Loading State Component
 * Displays loading UI with progress when section graph is executing
 */

import { AlertCircle } from 'lucide-react';
import { DiceLoader } from '../ui';
import { Button } from '../ui/button';

export interface SectionLoadingStateProps {
  sectionNumber: 1 | 2 | 3;
  sectionName: string;
  currentNode?: string;
  progress?: {
    current: number;
    total: number;
  } | null;
  error?: string | null;
  onRetry?: () => void;
}

export function SectionLoadingState({
  sectionNumber,
  sectionName,
  currentNode,
  progress,
  error,
  onRetry,
}: SectionLoadingStateProps) {
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4" data-testid="section-loading-error">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="w-8 h-8" />
          <h3 className="text-xl font-semibold">Generation Failed</h3>
        </div>

        <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">{error}</p>

        {onRetry && (
          <Button onClick={onRetry} variant="default" data-testid="retry-section-button">
            Retry Section {sectionNumber}
          </Button>
        )}
      </div>
    );
  }

  // Loading state
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6" data-testid="section-loading-active">
      <DiceLoader />

      <div className="text-center space-y-4 w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{sectionName}</h3>

        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span className="font-mono">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aurora-500 to-accent transition-all duration-500 ease-out"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {currentNode && (
          <p className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
            {currentNode}
          </p>
        )}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-md">
        <p>This may take a few minutes. Feel free to grab a coffee!</p>
      </div>
    </div>
  );
}
