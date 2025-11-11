/**
 * Tools Panel
 * Displays chronological history of all tool calls
 */

import { useState } from 'react';
import type { ToolCall } from '../ui/ToolNotificationToast';

interface ToolsPanelProps {
  toolCalls: ToolCall[];
  isOpen: boolean;
  onToggle: () => void;
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
  roll_dice: 'bg-purple-900/50 border-purple-500/50',
  attribute_check: 'bg-blue-900/50 border-blue-500/50',
  saving_throw: 'bg-green-900/50 border-green-500/50',
  attack_roll: 'bg-red-900/50 border-red-500/50',
  deal_damage: 'bg-orange-900/50 border-orange-500/50',
  combat_attack: 'bg-red-900/50 border-red-500/50',
  combat_move: 'bg-cyan-900/50 border-cyan-500/50',
  spell_cast: 'bg-violet-900/50 border-violet-500/50',
  default: 'bg-zinc-900/50 border-zinc-500/50',
};

function formatToolName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const icon = TOOL_ICONS[toolCall.toolName] || TOOL_ICONS.default;
  const colorClass = TOOL_COLORS[toolCall.toolName] || TOOL_COLORS.default;

  return (
    <div className={`${colorClass} border rounded-lg p-3 hover:bg-opacity-75 transition-colors`}>
      <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                {formatToolName(toolCall.toolName)}
              </h4>
              <span className="text-xs text-gray-400">{formatTimestamp(toolCall.timestamp)}</span>
            </div>
            {!isExpanded && Object.keys(toolCall.parameters).length > 0 && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                {Object.entries(toolCall.parameters)[0][0]}: {formatValue(Object.entries(toolCall.parameters)[0][1])}
                {Object.keys(toolCall.parameters).length > 1 && ' ...'}
              </p>
            )}
          </div>
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/20 space-y-3">
          {Object.keys(toolCall.parameters).length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-gray-300 mb-2">Parameters:</h5>
              <div className="space-y-2 text-xs">
                {Object.entries(toolCall.parameters).map(([key, value]) => (
                  <div key={key} className="bg-black/30 rounded p-2">
                    <div className="text-gray-400 font-medium mb-1">{key}:</div>
                    <pre className="text-white font-mono text-xs overflow-x-auto">{formatValue(value)}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {toolCall.result && (
            <div>
              <h5 className="text-xs font-bold text-gray-300 mb-2">Result:</h5>
              <div className="bg-green-900/30 rounded p-2">
                <pre className="text-green-300 font-mono text-xs overflow-x-auto">{formatValue(toolCall.result)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ToolsPanel({ toolCalls, isOpen, onToggle }: ToolsPanelProps) {
  const sortedToolCalls = [...toolCalls].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 bg-purple-600 hover:bg-purple-500 text-white rounded-full p-4 shadow-2xl transition-all"
        aria-label="Toggle tools panel"
      >
        <span className="text-2xl">🔧</span>
        {toolCalls.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {toolCalls.length}
          </span>
        )}
      </button>

      {/* Sliding Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-midnight-300/95 backdrop-blur-lg
          border-l border-shadow-700 shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-shadow-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔧</span>
              <h2 className="text-xl font-bold text-white">Tool Calls</h2>
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {toolCalls.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="text-gray-400 hover:text-white text-2xl"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>

          {/* Tool Call List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sortedToolCalls.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-2">No tool calls yet</p>
                <p className="text-sm">Tool calls will appear here when the DM uses game mechanics</p>
              </div>
            ) : (
              sortedToolCalls.map((toolCall) => <ToolCallCard key={toolCall.id} toolCall={toolCall} />)
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-shadow-700 bg-midnight-400/50">
            <p className="text-xs text-gray-400 text-center">
              Tool calls are actions the DM performs using game mechanics.
              <br />
              This ensures fair and transparent gameplay.
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onToggle} aria-hidden="true" />}
    </>
  );
}
