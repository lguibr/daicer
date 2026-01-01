import { UnifiedChatArea } from '@/components/chat/UnifiedChatArea';
import { useState } from 'react';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events?: any[];
}

export function GodModeChat({
  messages,
  onSendMessage,
  isProcessing = false,
  inputValue,
  onInputChange,
  activeLocation,
  onClearLocation,
  activeEntity,
  events = [],
}: GodModeChatProps) {
  // Merge Messages & Events
  const displayItems = [
    ...messages,
    ...events.map((e, index) => ({
      id: `event-${e.timestamp}-${index}`,
      role: 'system',
      sender: 'Engine',
      content: '', // No text content
      timestamp: e.timestamp,
      isEvent: true,
      data: e,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  const [activeCommand, setActiveCommand] = useState<{
    prefix: string;
    id: string;
    name: string;
    label: string;
  } | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <UnifiedChatArea
          messages={displayItems}
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
          activeCommand={activeCommand || undefined}
          onClearCommand={() => setActiveCommand(null)}
          onCommandSelect={(cmd) => {
            setActiveCommand(cmd);
            onInputChange('');
          }}
          activeLocation={activeLocation || undefined}
          onClearLocation={onClearLocation}
          activeEntity={activeEntity}
        />
      </div>
    </div>
  );
}
