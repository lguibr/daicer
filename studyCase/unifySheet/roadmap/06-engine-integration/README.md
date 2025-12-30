# Phase 6: Engine Integration & Deep Cleanup

> **Objective**: Switch the Engine and Frontend to use the new fields exclusively.

## 6.1. Update `spawn-service.ts`

- Modify the Monster Spawner loop.
- **Copy**:
  - `monster.stats` -> `sheet.stats`.
  - `monster.structuredActions` -> `sheet.actions`.
  - `monster.features` -> `sheet.features`.
- **Stop Copying**: The old `monster.actions` (unless as fallback text).

## 6.2. Update `character-lifecycle.ts`

- Ensure Character creation logic correctly aggregates `class.features` and `race.traits` into the new `sheet.features` list.
- Ensure `sheet.actions` are generated from Inventory.

## 6.3. The `CharacterDeriver` Update

- Update logic to calculate bonuses based on the new `proficiencies` tags.
- Update `canMove` logic to respect the full suite of speeds.

## 6.4. Frontend Refactor

- Update `CharacterSheet` component.
- Switch "Actions" tab to render from the `structuredActions` array.
- Switch "Features" tab to render from the unified `features` list.
- **Verify**: Check that attacks are clickable and roll correct dice.

## 6.5. Legacy Cleanup

- Remove `monster.actions` (Legacy JSON).
- Remove `monster.proficiencies`.
- Remove `monster.senses`.
- Remove `monster.speed` (already done, but verify).

## Deliverable

A fully unified system where `CharacterSheet` is the generic interface for all entities, capable of running complex automation for both Players and Monsters.
