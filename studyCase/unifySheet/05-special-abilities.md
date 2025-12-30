# 05. Special Abilities: Traits & Features

## The Disparity

### Monster (Current)

JSON Array `special_abilities`:

```json
[
  {
    "name": "Pack Tactics",
    "desc": "The kobold has advantage on an attack roll against a creature if at least one of the kobold's allies is within 5 feet of the creature and the ally isn't incapacitated."
  },
  {
    "name": "Sunlight Sensitivity",
    "desc": "While in sunlight, the kobold has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight."
  }
]
```

Again, unstructured text. `usage` (e.g., "3/Day") is sometimes embedded in the `name`.

### Character (Current)

Relations: `Feature` and `Trait`.

- **Traits**: Racial (e.g., "Darkvision", "Fey Ancestry").
- **Features**: Class (e.g., "Sneak Attack", "Second Wind").
- **Feats**: Selected at level up.

## The Standardized "Unified Sheet" Model

We need a unified **Feature Block**.

### Proposed Structure

```typescript
interface FeatureBlock {
  name: string;
  source: 'race' | 'class' | 'monster' | 'item' | 'feat';
  description: string;
  usage?: {
    max: number; // 3
    per: 'short_rest' | 'long_rest' | 'day';
    current: number; // Tracking usage
  };
  automation?: {
    effect: 'advantage' | 'bonus';
    trigger: 'attack' | 'check';
    condition: string; // "ally_within_5ft" (This is hard to automate fully)
  };
}
```

## Unification Strategy

1.  **For Monsters**:

    - Iterate `special_abilities`.
    - Map to `FeatureBlock` with `source: 'monster'`.
    - **Usage Parsing**: Regex parse "Name (3/Day)" into the `usage` object. This is a high-value quick win for tracking resources.

2.  **For Characters**:
    - Flatten `Race.traits` and `Class.features` into this same `FeatureBlock` list for the Sheet.
    - This allows the frontend to just render a single "Features" list, grouped by source, without needing to know if it's a "Trait" or "Feature" entity.

**Key Insight**: Polymorphing a player into a generic monster becomes easy: just replace their Feature List with the Monster's Feature List.
