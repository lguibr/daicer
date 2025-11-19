/**
 * Combat Log Component
 * Displays combat events and dice rolls
 */

import { useRef, useEffect, useState, type ReactNode } from 'react';
import type { CombatLogEntry, DiceRollResult } from '../../types/combat';

interface CombatLogProps {
  log: CombatLogEntry[];
  diceHistory: DiceRollResult[];
}

export function CombatLog({ log, diceHistory }: CombatLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [expandedRolls, setExpandedRolls] = useState<Set<string>>(new Set());

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const toggleRollExpanded = (rollId: string) => {
    setExpandedRolls((prev) => {
      const next = new Set(prev);
      if (next.has(rollId)) {
        next.delete(rollId);
      } else {
        next.add(rollId);
      }
      return next;
    });
  };

  const getRoll = (rollId: string): DiceRollResult | undefined => diceHistory.find((r) => r.id === rollId);

  const formatRoll = (roll: DiceRollResult): string => {
    const advantageText =
      roll.advantageType === 'advantage'
        ? ' (Advantage)'
        : roll.advantageType === 'disadvantage'
          ? ' (Disadvantage)'
          : '';

    const rawRollsText =
      roll.rawRolls.length > 1 && roll.diceType === 'd20'
        ? ` [${roll.rawRolls.join(', ')}]`
        : roll.rawRolls.length > 1
          ? ` [${roll.rawRolls.join(' + ')}]`
          : ` [${roll.rawRolls[0]}]`;

    const modifierText = roll.modifier !== 0 ? ` + ${roll.modifier}` : '';

    return `${roll.description}${advantageText}: ${rawRollsText}${modifierText} = **${roll.finalResult}**`;
  };

  const getLogTypeIcon = (type: string): string => {
    switch (type) {
      case 'attack':
        return '⚔️';
      case 'damage':
        return '💥';
      case 'move':
        return '🏃';
      case 'turn':
        return '▶️';
      case 'round':
        return '🔄';
      case 'victory':
        return '🏆';
      default:
        return '•';
    }
  };

  const getLogTypeColor = (type: string): string => {
    switch (type) {
      case 'attack':
        return 'text-orange-400';
      case 'damage':
        return 'text-red-400';
      case 'move':
        return 'text-sky-300';
      case 'turn':
        return 'text-shadow-200';
      case 'round':
        return 'text-aurora-200';
      case 'victory':
        return 'text-emerald-300';
      default:
        return 'text-shadow-300';
    }
  };

  const formatMarkdownToNodes = (text: string): ReactNode[] => {
    const nodes: ReactNode[] = [];
    const boldPattern = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null = boldPattern.exec(text);

    while (match !== null) {
      if (match.index > lastIndex) {
        const plainSegment = text.slice(lastIndex, match.index);
        nodes.push(<span key={`text-${match.index}-${nodes.length}`}>{plainSegment}</span>);
      }

      nodes.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
      match = boldPattern.exec(text);
    }

    if (lastIndex < text.length) {
      nodes.push(<span key={`text-${lastIndex}-end`}>{text.slice(lastIndex)}</span>);
    }

    return nodes.length > 0 ? nodes : [text];
  };

  return (
    <div className="bg-midnight-700/80 rounded-lg border border-midnight-600 overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-midnight-600">
        <h3 className="text-lg font-bold text-shadow-50">Combat Log</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {log.map((entry) => (
          <div key={entry.id} className="text-sm">
            <div className={`flex items-start gap-2 ${getLogTypeColor(entry.type)}`}>
              <span className="text-base">{getLogTypeIcon(entry.type)}</span>
              <div className="flex-1">
                <div className="text-shadow-50 leading-relaxed">{formatMarkdownToNodes(entry.message)}</div>

                {/* Show related rolls */}
                {entry.relatedRolls.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {entry.relatedRolls.map((rollId) => {
                      const roll = getRoll(rollId);
                      if (!roll) return null;

                      const isExpanded = expandedRolls.has(rollId);

                      return (
                        <div key={rollId} className="text-xs">
                          <button
                            type="button"
                            onClick={() => toggleRollExpanded(rollId)}
                            className="text-shadow-400 hover:text-aurora-300 transition-colors"
                          >
                            {isExpanded ? '▼' : '▶'} {roll.rollType} roll:{' '}
                            <span className="font-bold">{roll.finalResult}</span>
                          </button>

                          {isExpanded && (
                            <div className="ml-4 mt-1 p-2 bg-midnight-800/60 rounded text-shadow-300">
                              <div className="space-x-1">{formatMarkdownToNodes(formatRoll(roll))}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
