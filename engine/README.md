# @daicer/engine

## Purpose

The **Engine** is the deterministic, server-authoritative core of the Daicer system. It allows no ambiguity: math is math. It handles statistical derivation, world generation logic, and rule adjudication without any dependencies on the UI or API layers.

## Architecture

This package is a **pure TypeScript** library.

- **No Side Effects**: Functions are pure where possible.
- **No Database**: It accepts data, processes it, and returns results.
- **No UI**: It knows nothing of React or DOM.

It serves as the "Body" of the system, while the LLM acts as the "Soul". The Engine calculates that an attack hits; the LLM describes _how_ it hits.

## Key Modules

### 1. `derivation/`

Responsible for the **Deterministic Entity Computation**. It takes raw database inputs (attributes, equipment) and derives the final actionable stats (AC, HP, Attack Bonuses, Speed).

- **Primary Entry**: `CharacterDeriver` (to be implemented/documented).

### 2. `voxel/`

The procedural generation logic for the world.

- **Entities**: `Chunk`, `Terrain`, `Civilization`.
- **Purpose**: Generates deterministic terrain and points of interest based on coordinate seeds.

### 3. `schemas/`

Zod schemas that define the "Shape of Truth" for game actions and entities.

- Used to validate inputs before they touch the game state.

### 4. `rules/`

Hardcoded 5e-based constants and progression tables.

- **Example**: XP thresholds, Proficiency Bonus tables.

## Usage

```typescript
import { calculateModifier } from '@daicer/engine';

// Deterministic Math
const strength = 18;
const mod = calculateModifier(strength); // Returns 4
```

## Dependencies

- **Upstream**: None (Pure utility).
- **Downstream**:
  - `@daicer/backend` (Uses it to process game actions).
  - `@daicer/frontend` (May use it for optimistic UI updates or client-side prediction, though typically state comes from Backend).
