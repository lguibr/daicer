import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight, MapPin, Calendar, Scroll } from 'lucide-react';
import type { WorldHistory, HistoricalPeriod } from '@daicer/shared';

interface HistoryTimelineProps {
  history: WorldHistory;
  className?: string;
}

export function HistoryTimeline({ history, className = '' }: HistoryTimelineProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(new Set([0]));

  const togglePeriod = (periodNum: number) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(periodNum)) {
      newExpanded.delete(periodNum);
    } else {
      newExpanded.add(periodNum);
    }
    setExpandedPeriods(newExpanded);
  };

  const getEraColor = (periodNum: number) => {
    const colors = [
      'border-l-aurora-blue',
      'border-l-gilded-gold',
      'border-l-aurora-green',
      'border-l-aurora-purple',
      'border-l-crimson-red',
    ];
    return colors[periodNum % colors.length];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Summary */}
      <Card className="p-6 bg-parchment-light dark:bg-obsidian-dark">
        <div className="flex items-start gap-3 mb-3">
          <Scroll className="w-5 h-5 text-gilded-gold mt-1" />
          <h2 className="text-2xl font-serif text-ink-primary dark:text-parchment-light">World History</h2>
        </div>
        <p className="text-ink-secondary dark:text-parchment-medium leading-relaxed">{history.overallSummary}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-ink-tertiary dark:text-parchment-dark">
          <Calendar className="w-4 h-4" />
          <span>
            {history.totalYears} years across {history.periods.length} eras
          </span>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-3">
        {history.periods.map((period: HistoricalPeriod) => {
          const isExpanded = expandedPeriods.has(period.periodNumber);
          const eraColor = getEraColor(period.periodNumber);

          return (
            <Card
              key={period.periodNumber}
              className={`border-l-4 ${eraColor} transition-all duration-200 hover:shadow-md`}
            >
              <button
                type="button"
                onClick={() => togglePeriod(period.periodNumber)}
                className="w-full p-4 text-left flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gilded-gold" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gilded-gold" />
                    )}
                    <h3 className="text-lg font-serif text-ink-primary dark:text-parchment-light">
                      Era {period.periodNumber + 1}
                    </h3>
                  </div>
                  <div className="text-sm text-ink-tertiary dark:text-parchment-dark ml-6">
                    Years {period.startYear}–{period.endYear}
                    {period.structures.length > 0 && (
                      <span className="ml-3">
                        <MapPin className="inline w-3 h-3 mr-1" />
                        {period.structures.length} structure{period.structures.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Narrative */}
                  <div className="prose prose-sm dark:prose-invert max-w-none ml-6">
                    <div
                      className="text-ink-secondary dark:text-parchment-medium"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: period.narrative }}
                    />
                  </div>

                  {/* Structures */}
                  {period.structures.length > 0 && (
                    <div className="ml-6">
                      <h4 className="text-sm font-semibold text-ink-primary dark:text-parchment-light mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Notable Structures
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {period.structures.map((structure) => (
                          <div
                            key={structure.id}
                            className="p-3 bg-parchment-medium/10 dark:bg-obsidian-light/20 rounded border border-parchment-dark/20 dark:border-obsidian-light/20"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-ink-primary dark:text-parchment-light truncate">
                                  {structure.name}
                                </div>
                                <div className="text-xs text-ink-tertiary dark:text-parchment-dark flex items-center gap-2 mt-1">
                                  <span className="capitalize">{structure.type}</span>
                                  <span>•</span>
                                  <span className="capitalize">{structure.size}</span>
                                </div>
                              </div>
                              <div
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                                style={{
                                  backgroundColor: `hsl(${structure.significance * 36}, 70%, 50%)`,
                                  color: 'white',
                                }}
                                title={`Significance: ${structure.significance}/10`}
                              >
                                {structure.significance}
                              </div>
                            </div>
                            <p className="text-xs text-ink-secondary dark:text-parchment-medium mt-2 line-clamp-2">
                              {structure.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
