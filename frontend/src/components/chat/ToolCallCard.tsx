import { useState } from 'react';
import type { ToolCall } from '../../services/socket';
import cn from '../../lib/utils';
import { DiceLoader } from '../ui/dice-loader';
import DiceRollCard from './DiceRollCard';

interface ToolCallCardProps {
  toolCall: ToolCall;
  status: 'pending' | 'running' | 'complete' | 'error';
  className?: string;
}

/**
 * Beautiful tool execution card showing what the DM is doing
 */
export default function ToolCallCard({ toolCall, status, className }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = () => {
    switch (toolCall.toolName) {
      case 'roll_dice':
        return '🎲';
      case 'lookup_rule':
        return '📖';
      case 'initiate_combat':
        return '⚔️';
      case 'spawn_creature':
        return '👹';
      case 'check_inventory':
        return '🎒';
      default:
        return '🔧';
    }
  };

  const getToolLabel = () => {
    switch (toolCall.toolName) {
      case 'roll_dice':
        return 'Rolling Dice';
      case 'lookup_rule':
        return 'Checking Rules';
      case 'initiate_combat':
        return 'Starting Combat';
      case 'spawn_creature':
        return 'Summoning Creature';
      case 'check_inventory':
        return 'Checking Inventory';
      default:
        return toolCall.toolName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'border-aurora-500/40 bg-aurora-900/20';
      case 'complete':
        return 'border-emerald-500/40 bg-emerald-900/20';
      case 'error':
        return 'border-red-500/40 bg-red-900/20';
      default:
        return 'border-midnight-600/40 bg-midnight-800/20';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <DiceLoader size="small" diceCount={1} maxDiceCount={2} />;
      case 'complete':
        return <span className="text-emerald-400">✓</span>;
      case 'error':
        return <span className="text-red-400">✗</span>;
      default:
        return <span className="text-midnight-400">◦</span>;
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300',
        getStatusColor(),
        'shadow-[0_8px_16px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      {/* Tool Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
      >
        <span className="text-2xl">{getToolIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-shadow-100">{getToolLabel()}</p>
          {status === 'running' && <p className="text-xs text-shadow-400">Processing...</p>}
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs text-shadow-500">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded || toolCall.toolName === 'roll_dice' ? (
        <div className="border-t border-white/10 px-4 py-3">
          {/* SPECIAL: Dice Roll Visualization */}
          {toolCall.toolName === 'roll_dice' && (
            <div className="mb-4">
              {(() => {
                // Parse args: "1d20+5"
                const expr = String(toolCall.parameters?.expression || toolCall.parameters?.['0'] || '1d20');
                const result =
                  typeof toolCall.result === 'object'
                    ? (toolCall.result as { total: number }).total
                    : Number(toolCall.result) || 0;

                return (
                  <div className="transform scale-90 origin-top-left">
                    <DiceRollCard
                      roll={{
                        dice: expr,
                        result,
                        breakdown:
                          typeof toolCall.result === 'object'
                            ? (toolCall.result as { expression: string }).expression
                            : expr,
                        purpose: 'Skill Check',
                      }}
                      animate={status === 'running' || status === 'complete'}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {/* Parameters */}
          {!!Object.keys(toolCall.parameters ?? {}).length && toolCall.toolName !== 'roll_dice' && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-shadow-400">Parameters</p>
              <div className="space-y-1">
                {(Object.entries(toolCall.parameters ?? {}) as Array<[string, unknown]>).map(([key, value]) => {
                  const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                  return (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="font-medium text-aurora-300">{key}:</span>
                      <span className="text-shadow-200">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result (Hidden for dice as card shows it) */}
          {toolCall.result && toolCall.toolName !== 'roll_dice' ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-shadow-400">Result</p>
              <div className="rounded-lg bg-midnight-900/50 p-3 font-mono text-xs text-emerald-300">
                {typeof toolCall.result === 'object'
                  ? JSON.stringify(toolCall.result, null, 2)
                  : String(toolCall.result)}
              </div>
            </div>
          ) : null}

          {/* Timestamp */}
          <p className="mt-2 text-xs text-shadow-500">{new Date(toolCall.timestamp).toLocaleTimeString()}</p>
        </div>
      ) : null}

      {/* Running Animation */}
      {status === 'running' && (
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-aurora-500/0 via-aurora-500/20 to-aurora-500/0" />
        </div>
      )}
    </div>
  );
}
