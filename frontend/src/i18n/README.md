# Internationalization (i18n)

Multi-language support for D20 AI.

## Supported Languages

- 🇺🇸 **English** (`en`)
- 🇪🇸 **Español** (`es`)
- 🇧🇷 **Português** (`pt-BR`)

## Usage

```typescript
import { useI18n } from '@/i18n';

function MyComponent() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div>
      <h1>{t('lobby.title')}</h1>
      <button onClick={() => setLanguage('es')}>
        Cambiar a Español
      </button>
    </div>
  );
}
```

## Translation Keys

All keys use dot notation:

- `auth.*` - Authentication screens
- `lobby.*` - Lobby and room joining
- `worldSettings.*` - World configuration
- `character.*` - Character creation
- `gameplay.*` - Game screen
- `debug.*` - Debug panel
- `common.*` - Shared strings

## With Replacements

```typescript
// Translation: "Room Code: {code}"
t('character.roomCode') + ': ' + roomCode;

// Or with params:
t('character.playersReady', { count: 3, total: 4 });
// Result: "3 / 4 players ready"
```

## Adding New Translations

1. Add key to `en.json`
2. Translate to `es.json`
3. Translate to `pt-BR.json`
4. Use with `t('category.key')`

## Language Detection

- Checks localStorage first
- Falls back to browser language
- Defaults to English
- Persists across sessions

## Backend Integration

Language is passed to backend APIs:

```typescript
await generateWorld(roomId, language);
await processTurn(roomId, language);
```

LLM generates responses in the same language.
