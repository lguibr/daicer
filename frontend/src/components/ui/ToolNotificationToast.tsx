/**
 * Tool Notification Toast
 * Displays when a tool is called by the LLM
 */

import { useEffect, useState } from 'react';

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  timestamp: number;
}

interface ToolNotificationToastProps {
  toolCall: ToolCall;
  onDismiss: (id: string) => void;
  duration?: number;
}

const TOOL_ICONS: Record<string, string> = {
  roll_dice: '🎲',
  attribute_check: '📊',
  saving_throw: '🛡️',
  attack_roll: '⚔️',
  deal_damage: '💥',
  combat_attack: '⚔️',
  combat_move: '🏃',
  spell_cast: '✨',
  default: '🔧',
};

const TOOL_COLORS: Record<string, string> = {
  roll_dice: 'bg-purple-900/90 border-purple-500',
  attribute_check: 'bg-blue-900/90 border-blue-500',
  saving_throw: 'bg-green-900/90 border-green-500',
  attack_roll: 'bg-red-900/90 border-red-500',
  deal_damage: 'bg-orange-900/90 border-orange-500',
  combat_attack: 'bg-red-900/90 border-red-500',
  combat_move: 'bg-cyan-900/90 border-cyan-500',
  spell_cast: 'bg-violet-900/90 border-violet-500',
  default: 'bg-zinc-900/90 border-zinc-500',
};

function formatToolName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function ToolNotificationToast({ toolCall, onDismiss, duration = 4000 }: ToolNotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const parameterEntries = Object.entries(toolCall.parameters);
  const hasParameters = parameterEntries.length > 0;
  const hasResult = toolCall.result !== undefined && toolCall.result !== null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toolCall.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toolCall.id, duration, onDismiss]);

  const icon = TOOL_ICONS[toolCall.toolName] || TOOL_ICONS.default;
  const colorClass = TOOL_COLORS[toolCall.toolName] || TOOL_COLORS.default;

  return (
    <div
      className={`
        ${colorClass}
        border-2 rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      style={{
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl" aria-hidden="true">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              {formatToolName(toolCall.toolName)}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => onDismiss(toolCall.id), 300);
              }}
              className="text-gray-400 hover:text-white text-xl leading-none"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>

          {hasParameters && (
            <div className="text-xs text-gray-300 space-y-1">
              {parameterEntries.map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-gray-400 font-medium">{key}:</span>
                  <span className="text-white font-mono break-all">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          )}

          {hasResult && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="text-xs text-gray-400 font-medium mb-1">Result:</div>
              <div className="text-xs text-green-300 font-mono">{formatValue(toolCall.result)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ToolNotificationContainerProps {
  toolCalls: ToolCall[];
  onDismiss: (id: string) => void;
}

export function ToolNotificationContainer({ toolCalls, onDismiss }: ToolNotificationContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      {toolCalls.map((toolCall) => (
        <div key={toolCall.id} className="pointer-events-auto">
          <ToolNotificationToast toolCall={toolCall} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
