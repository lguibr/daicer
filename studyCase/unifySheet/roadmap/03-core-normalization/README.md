# Phase 3: Core Normalization (Proficiencies, Senses, Languages)

> **Objective**: Convert unstructured JSON/String maps into the new structured schema fields.

**Tools**: `@strapi/client` scripts.

## 3.1. Proficiencies Migration

Script: `scripts/unify/migrate_proficiencies.ts`

- **Input**: `monster.proficiencies` (Array: `{ name: "Skill: Stealth", value: 6 }`)
- **Logic**:
  - Regex `^Skill: (.*)` -> extract "Stealth", normalize to "stealth".
  - Regex `^Saving Throw: (.*)` -> extract "Dex", normalize to "dex".
  - Append to `monster.stats.skills` and `monster.stats.saves`.
- **Validation**:
  - Compare `(Base Stat Mod + PB)` vs `Value`. If mismatch > 1, flag for "Expertise" or "Override".

## 3.2. Senses Migration

Script: `scripts/unify/migrate_senses.ts`

- **Input**: `monster.senses` (Object: `{ darkvision: "60 ft.", passive_perception: 12 }`)
- **Logic**:
  - Extract integer from string ("60 ft." -> 60).
  - Map keys `darkvision`, `blindsight`, `truesight`, `tremorsense`.
  - Write to `monster.stats.darkvision`, etc.
  - Write `passive_perception` to `monster.stats.passivePerception`.

## 3.3. Language Linking

Script: `scripts/unify/migrate_languages.ts`

- **Input**: `monster.languages` (String: "Common, Goblin, telepathy 60 ft.")
- **Logic**:
  - Split by comma.
  - Filter out "telepathy" (move to Senses/Features).
  - Lookup `api::language` by name (Case Insensitive).
  - If found/Partial Match -> Add ID to `monster.stats.languages` relation.
  - If not found -> Log warning.
- **Prerequisite**: Ensure the `Languages` collection is fully seeded with all 5e standard languages.

## Deliverable

Monsters now have populated `stats` components with rich data. The old fields can be marked deprecated.
