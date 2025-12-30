# 03. Languages: References vs. Strings

## The Disparity

### Monster (Current)

String: `"Common, Goblin"`.
This is fragile. "Goblin" might be misspelled, and it doesn't link to the `Language` entity in the DB, preventing dynamic translation features (e.g., "Show this text only to players who speak Goblin").

### Character (Current)

Relations: `languages` (Many-to-Many to `api::language.language`).
This is robust.

## The Standardized "Unified Sheet" Model

The Sheet must use **Relation IDs** (or Document IDs) for languages to enable system interactions.

### Proposed Structure

```typescript
interface Sheet {
  languages: string[]; // Array of Language Document IDs
}
```

## Unification Strategy

1.  **Monster Migration (Hard)**:
    - We need a script to iterate all Monsters, parse the `languages` string, lookup the corresponding `Language` entity, and store the IDs.
    - Fallback: If a language doesn't exist (e.g., "Telepathy"), assume it's a Special Ability, not a "Language" in the linguistic sense, or create a catch-all/custom tag.
2.  **Runtime**:
    - The Engine checks overlap: `player.languages.intersect(monster.languages)`.
    - Allows for "Unknown Language" obfuscation in chat.

**Note**: "Telepathy" is often listed in languages for Monsters. In the Unified Model, Telepathy is a **Special Sense** or **Ability**, not a spoken language ID. We should separate these.
