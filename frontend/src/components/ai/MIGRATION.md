# Migration Guide: StreamingChatArea & StreamingComposer → GameplayChatArea & GameplayComposer

## Overview

The chat components have been upgraded to use **AI Elements**, a modern component library for building ChatGPT-style interfaces with React and TypeScript. This migration preserves all existing functionality while providing better UX patterns and maintainability.

## Timeline

- **v1.x**: StreamingChatArea and StreamingComposer are deprecated but still functional
- **v2.0.0**: Old components will be removed

## Component Mapping

| Old Component       | New Component      | Location                             |
| ------------------- | ------------------ | ------------------------------------ |
| `StreamingChatArea` | `GameplayChatArea` | `@/components/game/GameplayChatArea` |
| `StreamingComposer` | `GameplayComposer` | `@/components/game/GameplayComposer` |

## What's Preserved

✅ **All features are preserved**:

- 3D dice animations (`DiceRollCard`)
- Tool call visualizations (`ToolCallCard`)
- Real-time streaming with Socket.IO
- Presence indicators (DM thinking, typing)
- Draft persistence in localStorage
- Private message filtering
- World description display
- Keyboard shortcuts (Enter/Shift+Enter)

## Migration Steps

### 1. Update Imports

**Before:**

```typescript
import StreamingChatArea from '../chat/StreamingChatArea';
import StreamingComposer from '../chat/StreamingComposer';
```

**After:**

```typescript
import GameplayChatArea from './GameplayChatArea';
import GameplayComposer from './GameplayComposer';
```

### 2. Update Component Usage

#### Chat Area Migration

**Before:**

```tsx
<StreamingChatArea
  messages={socket.messages}
  streamingMessages={socket.streamingMessages}
  worldDescription={room.worldDescription}
  isProcessing={socket.isProcessing}
  presence={socket.presence}
/>
```

**After:**

```tsx
<GameplayChatArea
  messages={socket.messages}
  streamingMessages={socket.streamingMessages}
  worldDescription={room.worldDescription}
  isProcessing={socket.isProcessing}
  presence={socket.presence}
/>
```

✅ Props are **100% compatible** - no changes needed!

#### Composer Migration

**Before:**

```tsx
<StreamingComposer
  roomId={room.id}
  userName={currentPlayer?.character.name || user?.displayName || 'Player'}
  onSubmit={handleSubmitAction}
  disabled={submitting || socket.isProcessing}
  placeholder={t('gameplay.actionPlaceholder')}
  isProcessing={socket.isProcessing}
/>
```

**After:**

```tsx
<GameplayComposer
  roomId={room.id}
  userName={currentPlayer?.character.name || user?.displayName || 'Player'}
  onSubmit={handleSubmitAction}
  disabled={submitting || socket.isProcessing}
  placeholder={t('gameplay.actionPlaceholder')}
  isProcessing={socket.isProcessing}
/>
```

✅ Props are **100% compatible** - no changes needed!

## What's New

### Enhanced UX

1. **Better Auto-Scroll**
   - Smoother scroll behavior
   - More reliable "stick to bottom" detection
   - Improved scroll button placement

2. **Message Actions**
   - Copy message text
   - Regenerate DM responses
   - Delete messages (DM only)

3. **Better Markdown Rendering**
   - Auto-completes incomplete formatting during streaming
   - Syntax-highlighted code blocks
   - Enhanced table and list rendering

4. **Improved Accessibility**
   - Better ARIA labels
   - Keyboard navigation support
   - Screen reader compatibility

### Underlying Architecture

The new components use these AI Elements primitives:

- `Conversation` - Auto-scrolling container
- `Message` - Role-based message layout
- `Response` - Streaming markdown renderer
- `PromptInput` - Auto-resizing input with toolbar

These can be used independently in other parts of your app!

## Breaking Changes

**None!** This is a drop-in replacement. All props and behaviors are preserved.

## Example: Complete GameplayScreen Migration

```typescript
// frontend/src/components/game/GameplayScreen.tsx

// OLD imports
import StreamingChatArea from '../chat/StreamingChatArea';
import StreamingComposer from '../chat/StreamingComposer';

// NEW imports
import GameplayChatArea from './GameplayChatArea';
import GameplayComposer from './GameplayComposer';

export default function GameplayScreen({ room, players }: GameplayScreenProps) {
  // ... existing code ...

  return (
    <>
      {/* Chat Area */}
      <div className="flex-1 bg-midnight-950/30 overflow-hidden">
        <GameplayChatArea
          messages={socket.messages}
          streamingMessages={socket.streamingMessages}
          worldDescription={room.worldDescription}
          isProcessing={socket.isProcessing}
          presence={socket.presence}
        />
      </div>

      {/* Composer */}
      {!hasSubmitted ? (
        <GameplayComposer
          roomId={room.id}
          userName={currentPlayer?.character.name || user?.displayName || 'Player'}
          onSubmit={handleSubmitAction}
          disabled={submitting || socket.isProcessing}
          placeholder={t('gameplay.actionPlaceholder')}
          isProcessing={socket.isProcessing}
        />
      ) : (
        <div className="text-center p-4">
          <p>✓ Action submitted</p>
        </div>
      )}
    </>
  );
}
```

## Troubleshooting

### Deprecation Warnings

If you see console warnings like:

```
[DEPRECATED] StreamingChatArea is deprecated. Use GameplayChatArea instead.
```

Simply follow the migration steps above to remove them.

### TypeScript Errors

If you get type errors after migration:

1. Ensure you're importing from the correct path
2. Check that all props are still being passed
3. Run `yarn typecheck` to see detailed errors

### Styling Issues

The new components use the same midnight/aurora/nebula theme system. If you see styling differences:

1. Check that Tailwind classes are being applied correctly
2. Verify custom CSS doesn't conflict with new component classes
3. Test in both light and dark modes

## Support

Need help with migration?

- Check the [AI Elements documentation](../ai/README.md)
- Review the [Storybook examples](../ai/*.stories.tsx)
- Open an issue if you encounter problems

## Questions & Answers

**Q: Do I need to update my backend/Socket.IO code?**
A: No! The backend interface is unchanged. All socket events and message formats remain the same.

**Q: Will my dice animations still work?**
A: Yes! DiceRollCard is fully integrated and works identically.

**Q: Can I still use custom markdown renderers?**
A: Yes! The Response component supports custom remark/rehype plugins.

**Q: What if I want to customize the new components?**
A: They follow shadcn/ui patterns - you own the code! Edit `GameplayChatArea.tsx` and `GameplayComposer.tsx` directly.

**Q: Can I run both old and new components side by side during migration?**
A: Yes, but not recommended. Pick one approach and stick with it to avoid confusion.
