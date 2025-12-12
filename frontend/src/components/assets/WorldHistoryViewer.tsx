/**
 * WorldHistoryViewer Component
 * Read-only timeline display of world history with eras and structures
 */

import { useState } from 'react';
import { Clock, Landmark, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Structure {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  significance: number;
  description?: string;
}

interface HistoryPeriod {
  name: string;
  yearStart: number;
  yearEnd: number;
  description: string;
  keyEvents: string[];
  structures: Structure[];
}

interface WorldHistory {
  overallSummary: string;
  periods: HistoryPeriod[];
}

interface WorldHistoryViewerProps {
  history: WorldHistory;
  onStructureClick?: (structure: Structure) => void;
  onPeriodHover?: (period: HistoryPeriod | null) => void;
}

/**
 * Timeline era card
 */
function PeriodCard({
  period,
  index,
  onStructureClick,
  onHover,
}: {
  period: HistoryPeriod;
  index: number;
  onStructureClick?: (structure: Structure) => void;
  onHover?: (period: HistoryPeriod | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  const duration = period.yearEnd - period.yearStart;

  return (
    <Card
      className="relative overflow-hidden transition-all hover:shadow-lg"
      onMouseEnter={() => onHover?.(period)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Era indicator line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent via-aurora-blue to-accent/50" />

      <div className="p-4 pl-6">
        {/* Period header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-serif font-bold text-ink-primary dark:text-parchment-light mb-1">
              {period.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-ink-tertiary dark:text-parchment-dark">
              <Clock className="w-3 h-3" />
              <span>
                {period.yearStart} - {period.yearEnd} ({duration} years)
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-ink-secondary dark:text-parchment-medium mb-3 line-clamp-2">{period.description}</p>

        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-3 border-t border-parchment-dark/20 dark:border-obsidian-light/20 pt-3">
            {/* Key events */}
            {period.keyEvents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-ink-primary dark:text-parchment-light mb-2">Key Events</h4>
                <ul className="space-y-1">
                  {period.keyEvents.map((event, idx) => (
                    <li key={idx} className="text-xs text-ink-secondary dark:text-parchment-medium flex gap-2">
                      <span className="text-accent">•</span>
                      <span>{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structures */}
            {period.structures.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-ink-primary dark:text-parchment-light mb-2 flex items-center gap-1">
                  <Landmark className="w-3 h-3" />
                  Structures Built ({period.structures.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {period.structures.map((structure) => (
                    <button
                      key={structure.id}
                      type="button"
                      onClick={() => onStructureClick?.(structure)}
                      className="text-left p-2 rounded bg-parchment-light/30 dark:bg-obsidian-light/30 hover:bg-accent/20 transition-colors"
                    >
                      <div className="text-xs font-medium text-ink-primary dark:text-parchment-light truncate">
                        {structure.name}
                      </div>
                      <div className="text-xs text-ink-tertiary dark:text-parchment-dark capitalize">
                        {structure.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Main WorldHistoryViewer component
 */
export function WorldHistoryViewer({ history, onStructureClick, onPeriodHover }: WorldHistoryViewerProps) {
  if (!history || history.periods.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-ink-tertiary dark:text-parchment-dark" />
        <p className="text-ink-secondary dark:text-parchment-medium">No historical data available</p>
      </Card>
    );
  }

  const totalStructures = history.periods.reduce((sum, p) => sum + p.structures.length, 0);
  const totalYears = history.periods[history.periods.length - 1]?.yearEnd || 0;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <Card className="p-4 bg-gradient-to-br from-accent/5 via-aurora-blue/5 to-accent/5">
        <h2 className="text-xl font-serif font-bold text-ink-primary dark:text-parchment-light mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          World History
        </h2>
        <p className="text-sm text-ink-secondary dark:text-parchment-medium mb-3">{history.overallSummary}</p>
        <div className="flex gap-4 text-xs text-ink-tertiary dark:text-parchment-dark">
          <div>
            <span className="font-semibold">{history.periods.length}</span> Eras
          </div>
          <div>
            <span className="font-semibold">{totalYears}</span> Years
          </div>
          <div>
            <span className="font-semibold">{totalStructures}</span> Structures
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-3">
        {history.periods.map((period, index) => (
          <PeriodCard
            key={`${period.name}-${index}`}
            period={period}
            index={index}
            onStructureClick={onStructureClick}
            onHover={onPeriodHover}
          />
        ))}
      </div>
    </div>
  );
}
