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

export function GodModeChat({
  messages,
  onSendMessage,
  isProcessing = false,
  inputValue,
  onInputChange,
}: GodModeChatProps) {
  return (
    <UnifiedChatArea
      messages={messages}
      onSendMessage={onSendMessage}
      inputValue={inputValue}
      onInputChange={onInputChange}
      isProcessing={isProcessing}
      mode="debug"
      hideInput={false}
    />
  );
}
