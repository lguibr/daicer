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
}

export function GodModeChat({
  messages,
  onSendMessage,
  isProcessing = false,
  inputValue,
  onInputChange,
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
          // NEW: Callback for structured command
          // @ts-ignore
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
            // If we have an active command, prefix it
            if (activeCommand) {
              // Reconstruct the full command string
              // e.g. summon_entity(id="123", <msg>)
              // Or simple append: summon_entity(id="123") + " " + msg
              // The user wants "summon_entity(id=...)" to be hidden behind the tag.
              // So the actual message sent to LLM should be:
              // prefix + " " + msg
              // or if the prefix ends in ), maybe we just append.

              // If format is `summon_entity(id="...")`, and user types `with 50 hp`
              // Result: `summon_entity(id="...") with 50 hp`

              const fullMsg = `${activeCommand.prefix} ${msg}`;
              await onSendMessage(fullMsg);
              setActiveCommand(null); // Reset after send
            } else {
              await onSendMessage(msg);
            }
          }}
          inputValue={inputValue}
          onInputChange={onInputChange}
          isProcessing={isProcessing}
          mode="debug"
          hideInput={false}
          hideHeader
          // @ts-ignore
          activeCommand={activeCommand}
          // @ts-ignore
          onClearCommand={() => setActiveCommand(null)}
        />
      </div>
    </div>
  );
}
