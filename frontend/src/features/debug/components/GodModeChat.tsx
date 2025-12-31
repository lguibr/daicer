import { UnifiedChatArea } from '@/components/chat/UnifiedChatArea';

// import { useRef } from 'react';
import { useEntitySearch } from '@/hooks/useEntitySearch';
import { useState } from 'react';
import { GodModePalette } from './GodModePalette';

export interface GodModeMessage {
  id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
  timestamp: number;
}

interface GodModeChatProps {
  messages: GodModeMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isProcessing?: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  activeLocation?: { label: string; x: number; y: number; z: number } | null;
  onClearLocation?: () => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities?: any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeEntity?: any;
}

export function GodModeChat({
  messages,
  onSendMessage,
  isProcessing = false,
  inputValue,
  onInputChange,
  activeLocation,
  onClearLocation,
  entities,
  activeEntity,
}: GodModeChatProps) {
  const { search, results, loading } = useEntitySearch();
  const [activeCommand, setActiveCommand] = useState<{
    prefix: string;
    id: string;
    name: string;
    label: string;
  } | null>(null);

  const handlePaletteAction = (action: string) => {
    // Parse the raw action to extract ID/Name if it matches our detailed format
    // Format 1: summon_entity(id="...")
    // Format 2: cast_spell(id="...")
    // Format 3: move_entity @Name (legacy/fallback)

    // const idMatch = action.match(/\(id="([^"]+)"\)/);
    // const prefixMatch = action.match(/^([a-z_]+)/);

    // We need the Name for the label. The Palette action string doesn't include name cleanly unless we change Palette.
    // Ideally GodModePalette should pass the *Object*, not just the string.
    // But for now, let's parse or just append if it's complicate.

    // Actually, to implement the "Tag" feature properly, we should refactor GodModePalette to pass the *data* not just the string.
    // BUT since I can't easily change the signature of `onAction` in one go without breaking props interface logic maybe...
    // Wait, GodModePalette is local to this feature.
    // I can assume the `action` string is just what gets sent.

    // Let's modify handlePaletteAction to accept an object OR string,
    // OR we just rely on parsing the string if we are careful.
    // But I don't have the NAME in the `summon_entity(id="...")` string.

    // Let's pass the raw text for now, but to get the TAG UI,
    // I will refactor GodModePalette to pass meaningful metadata.

    // For this step, I will just append the text as before, BUT I'll initiate the refactor in the next step.
    // Actually, the user wants the TAG UI NOW.
    // So I need to change GodModePalette to pass { action: string, label: string } or similar.

    const newValue = inputValue ? `${inputValue} ${action}` : action;
    onInputChange(newValue);
  };

  // WAIT - I need to modify GodModeChat to support the `activeCommand` prop first.
  // And GodModePalette needs to pass this info.

  // Re-implementing GodModeChat to support `activeCommand` prop on UnifiedChatArea
  // (UnifiedChatArea will be updated in next step to accept `activeCommand`)

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-midnight-800 bg-midnight-950">
        <GodModePalette
          onAction={handlePaletteAction}
          onSearch={search}
          searchResults={results}
          isLoading={loading}
          entities={entities}
          activeEntity={activeEntity}
          // NEW: Callback for structured command
          onCommandSelect={(cmd) => {
            setActiveCommand(cmd);
            onInputChange(''); // Clear input for the args part
          }}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <UnifiedChatArea
          messages={messages}
          onSendMessage={async (msg) => {
            let fullMsg = msg;

            // 1. Prepend Command
            if (activeCommand) {
              fullMsg = `${activeCommand.prefix} ${fullMsg}`;
            }

            // 2. Append Location
            if (activeLocation) {
              // If there's already content, add space.
              // The user prompt said: "move marker for the chat... after send the message we should reset".
              // The LLM expects "move ... to x,y,z" or similar.
              // We should make sure the format is intuitive.
              // If the user types "Summon goat", and Location is (10,10,0).
              // Result: "Summon goat at (10, 10, 0)"
              const separator = fullMsg.length > 0 ? ' ' : '';
              fullMsg = `${fullMsg}${separator}at (${activeLocation.x}, ${activeLocation.y}, ${activeLocation.z})`;
            }

            if (!fullMsg.trim()) return;

            // 3. Reset States (Immediately)
            setActiveCommand(null);
            if (onClearLocation) onClearLocation();

            await onSendMessage(fullMsg);
          }}
          inputValue={inputValue}
          onInputChange={onInputChange}
          isProcessing={isProcessing}
          mode="debug"
          hideInput={false}
          hideHeader
          activeCommand={activeCommand}
          onClearCommand={() => setActiveCommand(null)}
          activeLocation={activeLocation || undefined}
          onClearLocation={onClearLocation}
        />
      </div>
    </div>
  );
}
