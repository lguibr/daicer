# Phase 5: Feature Unification

> **Objective**: Consolidate Monster Special Abilities, Racial Traits, and Class Features into a single `Features` list.

## 5.1. Resource Usage Parsing

Script: `scripts/unify/parse_features.ts`

- **Input**: `monster.special_abilities`.
- **Logic**:
  - Look for headers: `Name (3/Day)`.
  - Extract Name: "Name".
  - Extract Usage: `max: 3`, `per: 'day'`.
  - Look for Recharge: `(Recharge 5-6)`.
- **Output**: Write to `monster.features`.

## 5.2. Character Trait/Feature Migration

- Ensure that `Race` and `Class` entities also use the new `game.feature` component instead of whatever legacy JSON/Component structure they currently use.
- This ensures that when we copy from Blueprint -> Sheet, the structure is identical.

## 5.3. Legendaries & Lair Actions

- Map `legendary_actions` to the same `features` list but with a tag `type: legendary`.
- Map `lair_actions` similarly.
- This unifies the "Resource Management" UI. A Legendary Action is just a Feature with a resource cost of "1 Legendary Action Point".

## Deliverable

A unified list of special abilities with machine-readable usage limits.
