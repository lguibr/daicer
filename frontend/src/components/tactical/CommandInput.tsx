/**
 * @file frontend/src/components/tactical/CommandInput.tsx
 * @description Natural language command input for tactical actions
 */

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled: boolean;
  suggestions?: string[];
}

const EXAMPLE_COMMANDS = [
  '"Gandalf moves to (5,3) and casts fireball"',
  '"Orc attacks nearest player"',
  '"Ranger takes dodge action"',
  '"Wizard casts shield on himself"',
];

export function CommandInput({ value, onChange, onSubmit, submitting, disabled, suggestions = [] }: CommandInputProps) {
  const [showExamples, setShowExamples] = useState(true);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="bg-midnight-800 rounded-lg border border-shadow-700 p-4">
      <div className="flex items-start gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowExamples(false)}
          placeholder="Enter your command... (e.g., 'Warrior moves to (3,4) and attacks Goblin')"
          disabled={disabled || submitting}
          className="flex-1 bg-midnight-700 text-shadow-50 border border-shadow-600 rounded px-3 py-2 min-h-[80px] resize-none focus:outline-none focus:border-aurora-400"
        />
        <Button
          onClick={onSubmit}
          disabled={disabled || submitting || !value.trim()}
          className="bg-aurora-500 hover:bg-aurora-400"
        >
          {submitting ? 'Processing...' : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Examples */}
      {showExamples && (
        <div className="mt-3 text-xs text-shadow-400">
          <div className="font-semibold mb-1">Example commands:</div>
          <div className="space-y-1">
            {EXAMPLE_COMMANDS.map((cmd, idx) => (
              <div key={idx} className="pl-2">
                • {cmd}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-3 p-2 bg-amber-900/20 border border-amber-600/30 rounded">
          <div className="text-xs text-amber-300 font-semibold mb-1">💡 Suggestions:</div>
          <div className="text-xs text-amber-200 space-y-1">
            {suggestions.map((suggestion, idx) => (
              <div key={idx}>• {suggestion}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
