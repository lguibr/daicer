# Phase 1: Foundation (Schema Hardening)

> **Objective**: Prepare the database schema to accept structured Unified Sheet data without breaking existing features.

This phase is purely additive. We introduce the new storage buckets before we start moving data.

## 1.1. Statistics Component Evolution (`game.stats`)

We need to evolve the `game.stats` component to support the new normalized fields.

- [ ] **Expand `proficiencies`**:
  - Add `saves` (JSON or Relation to Abilities? Recommended: JSON array of strings `['str', 'dex']`).
  - Add `skills` (JSON array of strings `['perception', 'stealth']`).
- [ ] **Expand `senses`**:
  - Add `passivePerception` (integer).
  - Add `darkvision` (integer, feet).
  - Add `blindsight` (integer, feet).
  - Add `truesight` (integer, feet).
  - Add `tremorsense` (integer, feet).
- [ ] **Expand `languages`**:
  - Add `languages` (Relation to `api::language.language` - Many-to-Many).

## 1.2. Action Component Creation (`game.action`)

We need a structure to hold the parsed data from the text blobs.

- [ ] **Create `game.action` component**:
  - `name` (string)
  - `type` (enum: melee, ranged, spell, utility)
  - `toHit` (integer)
  - `reach` (integer)
  - `reach` (integer)
  - `damage` (component list `game.damage-dice`)
  - `save` (component `game.save-dc`)
  - `area` (component `game.area-effect`: shape, size, width)
  - `duration` (enum: instantaneous, concentration, ...)

## 1.3. Feature Component Creation (`game.feature`)

For generic traits and special abilities.

- [ ] **Create `game.feature` component**:
  - `name` (string)
  - `description` (text)
  - `source` (enum: race, class, monster, feat)
  - `usage_max` (integer)
  - `usage_per` (enum: short_rest, long_rest, day)

## 1.4. Blueprint Schema Updates

- [ ] **Update `Monster`**:
  - Add `structuredActions` (dynamic zone or component list of `game.action`).
  - Add `features` (component list of `game.feature`).
- [ ] **Update `Character`**:
  - Confirm `baseStats` aligns with new `stats` definition.

## Deliverable

A Strapi Schema definition that requires **Zero Migration** (fields are optional/null initially) but allows the Scripts in Phase 2 to start writing data. Resets of the DB should likely be avoided; use strictly additive schema changes.
