# 02. Senses: Perception & Detection

## The Disparity

### Monster (Current)

JSON Blob:

```json
"senses": {
  "darkvision": "60 ft.",
  "passive_perception": 12
}
```

### Character (Current)

Strict rules:

- **Passive Perception**: `10 + Wis Mod + (Proficiency ? PB : 0)`.
- **Darkvision**: Comes from `Race` (e.g., Elf).
- **Blindsight/Truesight**: Rare, comes from high-level features or magic items.

## The Standardized "Unified Sheet" Model

Senses are effectively "Special Movement Modes" for vision. They should be strictly typed.

### Proposed Structure

```typescript
interface Senses {
  passivePerception: number; // Calculated, but cacheable.
  darkvision: number; // Range in feet (0 = none)
  blindsight: number;
  truesight: number;
  tremorsense: number;
}
```

## Unification Strategy

1.  **For Monsters**:

    - Parse "60 ft." -> `60`.
    - Explicitly map keys `darkvision`, `blindsight`, etc.
    - **Passive Perception**: Treat the Monster's value as a "target" but allow the Engine to recalculate it based on the Monster's WIS and Proficiency. If they differ significantly, grant a "Trait" bonus.

2.  **For Characters**:
    - `Race` defines base Darkvision.
    - Items (Goggles of Night) add to it.
    - `CharacterDeriver` outputs the final `Senses` object.

**Goal**: The Frontend `EntityCard` simply reads `sheet.senses.darkvision` and renders an icon. No string parsing on the client.
