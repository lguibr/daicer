# Internationalization

Runtime translation system powering English, Spanish, and Brazilian Portuguese experiences (expandable to more locales).

---

## Architecture

```mermaid
flowchart LR
    Provider[I18nProvider] --> Hook[useI18n]
    Hook --> Components

    Provider --> Resources[Locales (en/es/pt-BR)]
    Provider --> Detector[Language Detector]

    Hook --> Backend[REST / Socket requests]
    Backend --> LLM[LLM responses in requested locale]
```

- `I18nProvider` wraps the app in `src/i18n/provider.tsx`.
- Translation resources live under `src/i18n/locales/<lang>.json`.
- Language choice stored in localStorage (`daicer.language`) and mirrored to backend requests.

---

## Usage

```typescript
import { useI18n } from '@/i18n';

export function LobbyHeader() {
  const { t, language, setLanguage } = useI18n();

  return (
    <header className="flex items-center gap-4">
      <h1>{t('lobby.title')}</h1>
      <LanguageSelector value={language} onChange={setLanguage} />
    </header>
  );
}
```

- `t(key, params?)` returns localized string with optional replacements.
- `setLanguage(code)` rehydrates provider + updates localStorage + notifies backend.
- Hook exposes `formatDate` and `formatNumber` using locale-aware APIs.

---

## Namespacing

Translation keys follow `scope.key` convention:

| Scope             | Usage                              |
| ----------------- | ---------------------------------- |
| `auth.*`          | Authentication screens             |
| `lobby.*`         | Lobby and room creation            |
| `worldSettings.*` | World configuration wizard         |
| `character.*`     | Character creation                 |
| `gameplay.*`      | Narrative gameplay (chat, actions) |
| `combat.*`        | Combat UI                          |
| `debug.*`         | Debug panel + developer tooling    |
| `common.*`        | Shared labels and toasts           |

Avoid deeply nested keys; keep three levels max for readability.

---

## Parameter Substitution

```typescript
t('character.playersReady', { count: 3, total: 4 });
// => "3 / 4 players ready"

t('combat.turnAnnouncement', {
  round: 5,
  player: 'Mira',
});
```

Use named parameters, not positional placeholders. Ensure translations include same placeholder names.

---

## Detecting Language

Order of precedence:

1. Explicit selection (localStorage).
2. Browser language (`navigator.language`).
3. Default fallback (`en`).

`detectLanguage()` lives in `src/i18n/detect-language.ts`. Adding new languages requires updating `SUPPORTED_LANGUAGES` constant.

---

## Backend Coordination

- Hooks expose `language` to services; REST/Socket requests include header `x-language`.
- Backend ensures LangGraph and LLM calls respond in requested locale.
- When switching languages mid-session, we trigger `socket.emit('room:set-language')` to keep all players in sync.

---

## Adding a Language

1. Duplicate `en.json` to new locale file (e.g. `de.json`).
2. Translate values; keep keys identical.
3. Add entry to `SUPPORTED_LANGUAGES` and `LanguageOption` union type.
4. Update `LanguageSelector` options.
5. Provide QA checklist (smoke tests, accent checks) in PR description.

Use ISO language codes (`pt-BR`, `es`, `en`) to match backend expectations.

---

## Testing & QA

```bash
yarn test frontend/src/i18n/__tests__
```

- Ensure fallback works when translation key missing (logs warn, returns dev string).
- Validate parameter interpolation using tests.
- Run Playwright tests in each locale (`VITE_LANGUAGE_OVERRIDE` env forces language).

Storybook:

- Switch locale using the toolbar (`globals.language`).
- Confirm right-to-left support once new languages added (future work).

---

## Tooling

- Strings linted via `scripts/check-missing-translations.ts` (run `yarn i18n:check`).
- JSON files sorted alphabetically; run `yarn i18n:format` before committing.
- Use Crowdin/Locize integration (future TODO) for collaborative translation.
