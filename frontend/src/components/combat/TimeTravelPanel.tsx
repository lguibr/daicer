/**
 * Time Travel Panel Component
 * Allows navigating combat history and restoring previous states
 */

import { useState } from 'react';
import type { CombatHistory } from '../../types/combat';

interface TimeTravelPanelProps {
  history: CombatHistory[];
  currentIndex: number;
  onRestore: (index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function TimeTravelPanel({ history, currentIndex, onRestore, isOpen, onToggle }: TimeTravelPanelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-3 bg-nebula-600 hover:bg-nebula-500 text-white rounded-full shadow-lg transition-colors z-50"
        title="Open Time Travel"
        aria-label="Open Time Travel"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-midnight-300 border-l border-t border-shadow-800 rounded-tl-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-shadow-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-shadow-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Time Travel
        </h3>
        <button
          type="button"
          onClick={onToggle}
          className="text-shadow-400 hover:text-shadow-200 transition-colors"
          aria-label="Close Time Travel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-shadow-700" />

          {/* History entries */}
          <div className="space-y-2">
            {history.map((entry, index) => {
              const isCurrent = index === currentIndex;
              const isPast = index < currentIndex;
              const isFuture = index > currentIndex;

              return (
                <div
                  key={entry.timestamp}
                  className="relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Timeline dot */}
                  <div
                    className={`
                    absolute left-5 w-3 h-3 rounded-full border-2 z-10
                    ${isCurrent ? 'bg-nebula-500 border-nebula-400' : 'bg-shadow-800 border-shadow-600'}
                  `}
                  />

                  {/* Entry content */}
                  <div
                    role="button"
                    tabIndex={0}
                    className={`
                      ml-10 p-2 rounded border cursor-pointer transition-all
                      ${isCurrent ? 'bg-nebula-900/30 border-nebula-600' : 'bg-shadow-900/50 border-shadow-700'}
                      ${hoveredIndex === index ? 'bg-shadow-800 border-aurora-600' : ''}
                      ${isPast ? 'opacity-60' : ''}
                      ${isFuture ? 'opacity-40' : ''}
                    `}
                    onClick={() => onRestore(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onRestore(index);
                      }
                    }}
                  >
                    <div className="text-xs text-shadow-300">{formatTimestamp(entry.timestamp)}</div>
                    <div className="text-sm text-shadow-100 font-medium">{entry.description}</div>
                    <div className="text-xs text-shadow-400 mt-1">
                      Round {entry.state.round} • {entry.state.characters.filter((c) => c.hp > 0).length} alive
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {history.length === 0 && <div className="text-center text-shadow-400 py-8">No history yet</div>}
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-shadow-800 bg-shadow-900/50">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onRestore(Math.max(0, currentIndex - 1))}
            disabled={currentIndex <= 0}
            className="flex-1 px-3 py-2 bg-shadow-800 hover:bg-shadow-700 disabled:opacity-50 disabled:cursor-not-allowed text-shadow-200 rounded text-sm transition-colors"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => onRestore(Math.min(history.length - 1, currentIndex + 1))}
            disabled={currentIndex >= history.length - 1}
            className="flex-1 px-3 py-2 bg-shadow-800 hover:bg-shadow-700 disabled:opacity-50 disabled:cursor-not-allowed text-shadow-200 rounded text-sm transition-colors"
          >
            Next →
          </button>
        </div>
        <div className="text-xs text-shadow-400 text-center mt-2">
          {currentIndex + 1} / {history.length}
        </div>
      </div>
    </div>
  );
}
