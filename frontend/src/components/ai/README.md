# AI Elements Components

Production-ready React components for building ChatGPT-style conversational AI interfaces.

Built on [shadcn/ui](https://ui.shadcn.com/) principles with full TypeScript support and Daicer's custom design system.

## Architecture

AI Elements components are designed specifically for conversational AI applications:

- **Streaming-optimized**: Handle incomplete markdown, token-by-token updates
- **Game-specific integration**: Seamlessly works with DiceRollCard, ToolCallCard
- **Radix UI foundation**: Accessible, keyboard navigable, screen reader friendly
- **Tailwind styling**: Fully customizable with Daicer's midnight/aurora/shadow/nebula palettes
- **You own the code**: Modify any component to match your needs

## Component Overview

### Core Chat Components

#### `<Conversation>`

Auto-scrolling chat container with scroll-to-bottom button.

```tsx
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai';

<Conversation>
  <ConversationContent>
    {messages.map((msg) => (
      <Message key={msg.id} />
    ))}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>;
```

#### `<Message>`

Role-based message containers (user/assistant/system).

```tsx
import { Message, MessageContent, MessageAvatar } from '@/components/ai';

<Message from="assistant">
  <MessageAvatar src="/dm-avatar.jpg" name="DM" />
  <MessageContent>
    <Response>{content}</Response>
  </MessageContent>
</Message>;
```

#### `<Response>`

Streaming-optimized markdown renderer with auto-completion.

```tsx
import { Response } from '@/components/ai';

<Response parseIncompleteMarkdown={isStreaming}>{streamingContent}</Response>;
```

**Features:**

- Auto-completes `**incomplete bold`, `*italic*`, `` `code` ``
- Hides broken links until complete
- Syntax highlighting via Prism
- GFM tables, task lists, strikethrough
- Math equations via KaTeX

#### `<PromptInput>`

Auto-resizing textarea with toolbar and submit button.

```tsx
import { PromptInput, PromptInputTextarea, PromptInputToolbar, PromptInputSubmit } from '@/components/ai';

<PromptInput onSubmit={handleSubmit}>
  <PromptInputTextarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your action..." />
  <PromptInputToolbar>
    <PromptInputSubmit status={isProcessing ? 'streaming' : 'ready'} />
  </PromptInputToolbar>
</PromptInput>;
```

### AI-Specific Features

#### `<CodeBlock>`

Syntax-highlighted code with copy button.

```tsx
import { CodeBlock, CodeBlockCopyButton } from '@/components/ai';

<CodeBlock code="const x = 42;" language="javascript" showLineNumbers>
  <CodeBlockCopyButton />
</CodeBlock>;
```

#### `<Reasoning>`

Collapsible AI thinking process (for DeepSeek R1, o1, etc.).

```tsx
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai';

<Reasoning isStreaming={thinking} defaultOpen={false}>
  <ReasoningTrigger />
  <ReasoningContent>{thinkingProcess}</ReasoningContent>
</Reasoning>;
```

#### `<Sources>`

Collapsible source citations (Perplexity-style).

```tsx
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai';

<Sources>
  <SourcesTrigger sources={urls} />
  <SourcesContent>
    <Source title="Article" url="https://..." description="..." />
  </SourcesContent>
</Sources>;
```

#### `<Actions>`

Message-level actions (copy, regenerate, delete).

```tsx
import { Actions, ActionCopy, ActionRegenerate, ActionDelete } from '@/components/ai';

<Actions>
  <ActionCopy text={content} />
  <ActionRegenerate onRegenerate={handleRegenerate} />
  <ActionDelete onDelete={handleDelete} />
</Actions>;
```

## Daicer-Specific Components

### `<GameplayChatArea>`

Full-featured chat area combining AI Elements with game-specific features.

**Location:** `@/components/game/GameplayChatArea`

```tsx
import GameplayChatArea from '@/components/game/GameplayChatArea';

<GameplayChatArea
  messages={socket.messages}
  streamingMessages={socket.streamingMessages}
  worldDescription={room.worldDescription}
  isProcessing={socket.isProcessing}
  presence={socket.presence}
/>;
```

**Integrations:**

- ✅ **DiceRollCard** - 3D dice animations (MANDATORY feature)
- ✅ **ToolCallCard** - Tool execution visualization
- ✅ **PresenceIndicators** - DM thinking, typing states
- ✅ **StreamingMessages** - Real-time token updates
- ✅ **PrivateMessages** - Filtered by recipientId

### `<GameplayComposer>`

Game-specific input with typing indicators and draft persistence.

**Location:** `@/components/game/GameplayComposer`

```tsx
import GameplayComposer from '@/components/game/GameplayComposer';

<GameplayComposer
  roomId={room.id}
  userName={playerName}
  onSubmit={handleAction}
  disabled={isProcessing}
  placeholder="What do you do?"
  isProcessing={socket.isProcessing}
/>;
```

**Features:**

- Draft persistence (localStorage)
- Typing indicators (Socket.IO)
- Processing states
- Auto-clear on submit

## Integration with Backend

AI Elements components work with the existing LangChain/Socket.IO backend:

```typescript
// No backend changes required!
// All socket events remain the same:
socket.on('message', (msg) => {
  /* ... */
});
socket.on('streaming_message', (data) => {
  /* ... */
});
socket.on('tool_call', (toolCall) => {
  /* ... */
});
```

## Styling & Theming

Components use Daicer's custom Tailwind theme:

```typescript
// tailwind.config.js color palettes
colors: {
  midnight: { /* dark blues */ },
  aurora: { /* cyan/teal */ },
  shadow: { /* neutral grays */ },
  nebula: { /* purples */ }
}

// Typography
fontFamily: {
  display: ['Cinzel', 'serif'],
  body: ['Spectral', 'serif']
}
```

Override with `className` prop on any component.

## Accessibility

All components follow ARIA-first design:

- Semantic HTML (`<article>`, `<button>`, `<nav>`)
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader labels
- Focus management
- Reduced motion support

## Testing

Components include Storybook stories:

```bash
yarn storybook
```

Stories available:

- `Conversation.stories.tsx`
- `Message.stories.tsx`
- `Response.stories.tsx`
- `PromptInput.stories.tsx`
- `CodeBlock.stories.tsx`
- `Reasoning.stories.tsx`
- `Sources.stories.tsx`
- `Actions.stories.tsx`

## Migration Guide

Migrating from old chat components? See [MIGRATION.md](./MIGRATION.md).

## Component Ownership

Following shadcn/ui philosophy, **you own these components**. They live in your codebase:

```
frontend/src/components/ai/
├── Conversation.tsx
├── Message.tsx
├── Response.tsx
├── PromptInput.tsx
├── CodeBlock.tsx
├── Reasoning.tsx
├── Sources.tsx
├── Actions.tsx
└── index.ts
```

Modify directly. No npm package lock-in.

## Dependencies

```json
{
  "@radix-ui/react-avatar": "^1.1.2",
  "@radix-ui/react-collapsible": "^1.1.2",
  "react-markdown": "^9.0.1",
  "react-syntax-highlighter": "^15.6.1",
  "remark-gfm": "^4.0.0",
  "rehype-katex": "^7.0.1",
  "rehype-sanitize": "^6.0.0"
}
```

## Credits

AI Elements components are derived from [Vercel's AI Elements](https://github.com/vercel/ai-elements) (Apache License 2.0, Copyright 2023 Vercel, Inc.), adapted for Daicer's game-first architecture and design system.
