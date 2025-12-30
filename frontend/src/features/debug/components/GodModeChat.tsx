import { UnifiedChatArea } from '@/components/chat/UnifiedChatArea';

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

// import { useRef } from 'react';
import { GodModePalette } from './GodModePalette';
import { useEntitySearch } from '@/hooks/useEntitySearch';

export function GodModeChat({
  messages,
  onSendMessage,
  isProcessing = false,
  inputValue,
  onInputChange,
}: GodModeChatProps) {
  const { search, results, loading } = useEntitySearch();

  const handlePaletteAction = (action: string) => {
    // If input has text, maybe append? For now replace or append.
    // Ideally we might just submit immediately if it's a complete command
    // But for safety, let's put it in input
    const newValue = inputValue ? `${inputValue} ${action}` : action;
    onInputChange(newValue);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <UnifiedChatArea
          messages={messages}
          onSendMessage={onSendMessage}
          inputValue={inputValue}
          onInputChange={onInputChange}
          isProcessing={isProcessing}
          mode="debug"
          hideInput={false}
          // We need to inject the palette above the input bar in UnifiedChatArea
          // But UnifiedChatArea encapsulates the input.
          // Option 1: Pass custom header/footer to UnifiedChatArea
          // Option 2: Render Palette *outside* UnifiedChatArea if layout permits
          // Let's try rendering it above for now, but UnifiedChatArea takes full height.
          // Actually, UnifiedChatArea usually handles the whole message list + input.
          // Let's see if we can pass a "TopSlot" or just wrap it.
        />
      </div>
      <div className="p-2 border-t border-midnight-700 bg-midnight-950">
        <div className="p-2 border-t border-midnight-700 bg-midnight-950">
          <GodModePalette
            onAction={handlePaletteAction}
            onSearch={search}
            searchResults={results}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}
