/**
 * Generation Timeline Component
 * Collapsible timeline of all world generation events
 * Shows after generation completes on owner review screen
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import MarkdownMessage from '../game/MarkdownMessage';

interface GenerationEvent {
  type: string;
  node?: string;
  periodNumber?: number;
  totalPeriods?: number;
  narrative?: string;
  placedCount?: number;
  savedCount?: number;
  roadCount?: number;
  influenceCount?: number;
  chunkCount?: number;
  timestamp?: number;
}

interface GenerationTimelineProps {
  events: GenerationEvent[];
}

export function GenerationTimeline({ events }: GenerationTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="card p-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
      >
        <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-aurora-300">
          Generation Timeline ({events.length} events)
        </h3>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-shadow-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-shadow-400" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.map((event, index) => {
            // Period narrative
            if (event.type === 'period_text_complete' && event.narrative) {
              return (
                <details key={index} className="group">
                  <summary className="cursor-pointer rounded-lg border border-nebula-500/40 bg-nebula-900/20 px-4 py-3 hover:bg-nebula-900/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-nebula-400">📖</span>
                      <span className="text-sm font-semibold text-nebula-200">Era {event.periodNumber} Narrative</span>
                      <ChevronRight className="w-4 h-4 text-shadow-400 group-open:rotate-90 transition-transform" />
                    </div>
                  </summary>
                  <div className="mt-2 rounded-lg bg-midnight-950/80 p-4 text-xs leading-relaxed text-shadow-200">
                    <MarkdownMessage content={event.narrative} />
                  </div>
                </details>
              );
            }

            // Node completion with metadata
            if (event.type === 'node_complete' && event.node) {
              const icons: Record<string, string> = {
                place_structures: '🏗️',
                materialize_structures: '🏰',
                generate_roads: '🛤️',
                collapse_terrain: '⛰️',
                pregenerate_chunks: '🗺️',
                generate_lore: '📖',
                synthesize_history: '📜',
              };
              const icon = icons[event.node] || '✓';

              return (
                <div key={index} className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">{icon}</span>
                    <span className="text-sm font-semibold text-emerald-200">
                      {event.node.replace(/_/g, ' ')} complete
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-shadow-400">
                    {event.placedCount && <span>📍 {event.placedCount} structures placed</span>}
                    {event.savedCount && <span>💾 {event.savedCount} structures materialized</span>}
                    {event.roadCount !== undefined && <span>🛤️ {event.roadCount} roads</span>}
                    {event.influenceCount && <span>⛰️ {event.influenceCount} terrain influences</span>}
                    {event.chunkCount && <span>🗺️ {event.chunkCount} chunks</span>}
                  </div>
                </div>
              );
            }

            // Period start
            if (event.type === 'period_start') {
              return (
                <div key={index} className="rounded-lg border border-aurora-500/40 bg-aurora-900/20 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-aurora-400 text-sm">📜</span>
                    <span className="text-xs font-semibold text-aurora-200">
                      Era {event.periodNumber} / {event.totalPeriods}
                    </span>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
