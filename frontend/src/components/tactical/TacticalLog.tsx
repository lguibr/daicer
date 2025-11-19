/**
 * @file frontend/src/components/tactical/TacticalLog.tsx
 * @description Combat log display for tactical encounters
 */

import { useRef, useEffect } from 'react';
import type { TacticalLogEntry } from './types';

interface TacticalLogProps {
  entries: TacticalLogEntry[];
  maxHeight?: string;
}

function getLogIcon(type: TacticalLogEntry['type']): string {
  switch (type) {
    case 'attack':
      return '⚔️';
    case 'damage':
      return '💥';
    case 'movement':
      return '🏃';
    case 'spell':
      return '✨';
    case 'healing':
      return '💚';
    case 'condition':
      return '🔴';
    case 'turn':
      return '▶️';
    case 'initiative':
      return '🎲';
    case 'system':
      return '⚙️';
    default:
      return '•';
  }
}

function getLogColor(type: TacticalLogEntry['type']): string {
  switch (type) {
    case 'attack':
      return 'text-orange-400';
    case 'damage':
      return 'text-red-400';
    case 'movement':
      return 'text-sky-300';
    case 'spell':
      return 'text-purple-400';
    case 'healing':
      return 'text-green-400';
    case 'condition':
      return 'text-amber-400';
    case 'turn':
      return 'text-shadow-200';
    case 'initiative':
      return 'text-aurora-300';
    default:
      return 'text-shadow-300';
  }
}

export function TacticalLog({ entries, maxHeight = '400px' }: TacticalLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  // Group entries by round
  const entriesByRound = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.round]) {
        acc[entry.round] = [];
      }
      acc[entry.round]!.push(entry);
      return acc;
    },
    {} as Record<number, TacticalLogEntry[]>
  );

  const rounds = Object.keys(entriesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="bg-midnight-800 rounded-lg border border-shadow-700 overflow-hidden flex flex-col">
      <div className="p-3 border-b border-shadow-700">
        <h3 className="text-lg font-bold text-shadow-50">Combat Log</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight }}>
        {rounds.map((round) => (
          <div key={round}>
            <div className="text-xs font-bold text-aurora-300 mb-2 sticky top-0 bg-midnight-800 py-1">
              ═══ Round {round} ═══
            </div>
            <div className="space-y-1">
              {entriesByRound[round]?.map((entry) => (
                <div key={entry.id} className="text-sm flex items-start gap-2">
                  <span className={`text-base ${getLogColor(entry.type)}`}>{getLogIcon(entry.type)}</span>
                  <div className="flex-1">
                    <span className="text-shadow-50">{entry.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="text-center text-shadow-400 text-sm py-8">Combat log is empty. Actions will appear here.</div>
        )}

        <div ref={logEndRef} />
      </div>
    </div>
  );
}
