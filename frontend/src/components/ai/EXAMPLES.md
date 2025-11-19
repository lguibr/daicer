# AI Elements Usage Examples

Complete, copy-paste examples for common use cases.

## Example 1: Basic Chat Interface

Simple chat with streaming responses:

```tsx
import { useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message,
  MessageContent,
  MessageAvatar,
  Response,
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from '@/components/ai';

export default function BasicChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Your API call here
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input }),
    });
    const data = await response.json();

    setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', content: data.reply }]);
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageAvatar
                src={msg.role === 'user' ? '/user.jpg' : '/ai.jpg'}
                name={msg.role === 'user' ? 'You' : 'AI'}
              />
              <MessageContent>
                <Response>{msg.content}</Response>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
        />
        <PromptInputToolbar>
          <PromptInputSubmit disabled={!input.trim()} status={isProcessing ? 'streaming' : 'ready'} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
```

## Example 2: Gameplay Chat (Daicer-specific)

Chat with dice rolls, tool calls, and presence indicators:

```tsx
import { useMemo } from 'react';
import GameplayChatArea from '@/components/game/GameplayChatArea';
import GameplayComposer from '@/components/game/GameplayComposer';
import { useSocket } from '@/services/socket';
import { useI18n } from '@/i18n';

export default function GameplayChat({ roomId, playerName }) {
  const { t } = useI18n();
  const socket = useSocket(roomId);

  const handleSubmit = (action) => {
    socket.sendAction(action);
  };

  return (
    <div className="flex h-screen flex-col">
      <GameplayChatArea
        messages={socket.messages}
        streamingMessages={socket.streamingMessages}
        worldDescription={socket.room?.worldDescription}
        isProcessing={socket.isProcessing}
        presence={socket.presence}
      />

      <GameplayComposer
        roomId={roomId}
        userName={playerName}
        onSubmit={handleSubmit}
        disabled={socket.isProcessing}
        placeholder={t('gameplay.actionPlaceholder')}
        isProcessing={socket.isProcessing}
      />
    </div>
  );
}
```

## Example 3: Code Generation with Syntax Highlighting

Generate and display code with copy buttons:

```tsx
import { useState } from 'react';
import { CodeBlock, CodeBlockCopyButton } from '@/components/ai';
import { PromptInput, PromptInputTextarea, PromptInputSubmit } from '@/components/ai';

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    const response = await fetch('/api/codegen', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();

    setGeneratedCode(data);
    setIsLoading(false);
    setPrompt('');
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">AI Code Generator</h1>

      {generatedCode && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{generatedCode.filename}</h2>
          <CodeBlock code={generatedCode.code} language={generatedCode.language} showLineNumbers>
            <CodeBlockCopyButton />
          </CodeBlock>
        </div>
      )}

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the code you want..."
        />
        <PromptInputSubmit disabled={!prompt.trim()} status={isLoading ? 'streaming' : 'ready'} />
      </PromptInput>
    </div>
  );
}
```

## Example 4: AI with Reasoning Display

Show AI thinking process (for o1, DeepSeek R1, etc.):

```tsx
import { useState } from 'react';
import { Message, MessageContent, Response, Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai';

export default function ReasoningExample({ message, isStreaming }) {
  return (
    <Message from="assistant">
      <MessageContent>
        {/* Show reasoning if available */}
        {message.reasoning && (
          <Reasoning isStreaming={isStreaming} defaultOpen={false}>
            <ReasoningTrigger title="Thinking" />
            <ReasoningContent>{message.reasoning}</ReasoningContent>
          </Reasoning>
        )}

        {/* Main response */}
        <Response parseIncompleteMarkdown={isStreaming}>{message.content}</Response>
      </MessageContent>
    </Message>
  );
}
```

## Example 5: Cited AI Responses

Display sources with expandable citations:

```tsx
import { Message, MessageContent, Response, Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai';

export default function CitedResponse({ message }) {
  return (
    <Message from="assistant">
      <MessageContent>
        <Response>{message.content}</Response>

        {/* Sources used */}
        {message.sources && message.sources.length > 0 && (
          <Sources className="mt-4">
            <SourcesTrigger sources={message.sources.map((s) => s.url)} />
            <SourcesContent>
              {message.sources.map((source, i) => (
                <Source key={i} title={source.title} url={source.url} description={source.description} />
              ))}
            </SourcesContent>
          </Sources>
        )}
      </MessageContent>
    </Message>
  );
}
```

## Example 6: Message Actions (Copy/Regenerate/Delete)

Add interactive actions to messages:

```tsx
import {
  Message,
  MessageContent,
  Response,
  Actions,
  ActionCopy,
  ActionRegenerate,
  ActionDelete,
} from '@/components/ai';

export default function MessageWithActions({ message, onRegenerate, onDelete }) {
  return (
    <Message from="assistant">
      <MessageContent>
        <Response>{message.content}</Response>

        <Actions className="mt-3">
          <ActionCopy text={message.content} />
          <ActionRegenerate onRegenerate={() => onRegenerate(message.id)} />
          <ActionDelete onDelete={() => onDelete(message.id)} />
        </Actions>
      </MessageContent>
    </Message>
  );
}
```

## Example 7: Custom Streaming Handler

Handle real-time streaming from Socket.IO:

```tsx
import { useState, useEffect } from 'react';
import { Message, MessageContent, Response } from '@/components/ai';
import { socket } from '@/services/socket';

export default function StreamingMessage({ messageId }) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    socket.on('streaming_chunk', (data) => {
      if (data.messageId === messageId) {
        setContent((prev) => prev + data.chunk);
      }
    });

    socket.on('streaming_complete', (data) => {
      if (data.messageId === messageId) {
        setIsStreaming(false);
      }
    });

    return () => {
      socket.off('streaming_chunk');
      socket.off('streaming_complete');
    };
  }, [messageId]);

  return (
    <Message from="assistant">
      <MessageContent>
        <Response parseIncompleteMarkdown={isStreaming}>{content}</Response>
      </MessageContent>
    </Message>
  );
}
```

## Example 8: Multi-modal Messages (Text + Images + Code)

Combine different content types in one message:

```tsx
import { Message, MessageContent, Response, CodeBlock, CodeBlockCopyButton } from '@/components/ai';

export default function MultiModalMessage({ message }) {
  return (
    <Message from="assistant">
      <MessageContent className="space-y-4">
        {/* Text content */}
        {message.text && <Response>{message.text}</Response>}

        {/* Generated images */}
        {message.images?.map((img, i) => (
          <img key={i} src={img.url} alt={img.alt} className="rounded-lg border shadow-lg" />
        ))}

        {/* Code blocks */}
        {message.code?.map((block, i) => (
          <CodeBlock key={i} code={block.code} language={block.language} showLineNumbers>
            <CodeBlockCopyButton />
          </CodeBlock>
        ))}
      </MessageContent>
    </Message>
  );
}
```

## Example 9: Loading States & Empty States

Handle different UI states gracefully:

```tsx
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai';
import { DiceLoader } from '@/components/ui/dice-loader';

export default function ChatWithStates({ messages, isLoading, error }) {
  return (
    <Conversation>
      <ConversationContent>
        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-3">
              <p className="text-xl font-semibold text-aurora-300">Start your adventure</p>
              <p className="text-shadow-400">Describe your action to begin...</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <Message key={msg.id} from={msg.role}>
            <MessageContent>
              <Response>{msg.content}</Response>
            </MessageContent>
          </Message>
        ))}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <DiceLoader size="medium" message="Generating response..." />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4">
            <p className="font-semibold text-red-400">Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
```

## Testing in Storybook

All components have Storybook stories:

```bash
yarn storybook
```

Navigate to "AI Components" section to see interactive examples.

## Need Help?

- Check [README.md](./README.md) for component APIs
- See [MIGRATION.md](./MIGRATION.md) for upgrading from old components
- Join [Discord](https://discord.com/invite/Z9NVtNE7bj) for community support
