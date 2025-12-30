# 04. Actions & Attacks: The "Attack" Model

## The Disparity

### Monster (Current)

Array of unstructured objects:

```json
"actions": [
  {
    "name": "Scimitar",
    "desc": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage."
  }
]
```

This is pure text. The engine cannot automate this. It doesn't know it's a "Melee" attack, or that it does "Slashing" damage, without NLP parsing.

### Character (Current)

Derived from **Equipment**:

- Item: `Scimitar` (Damage: 1d6, Type: Slashing, Prop: Finesse).
- Stats: `Dex` (+3).
- Proficiency: Yes (+2).
- Result: Engine calculates `+5` to Hit, `1d6+3` Damage.

## The Standardized "Unified Sheet" Model

We need a **Structured Action Format** that both can compile down to.

### Proposed Structure (Action Schema)

```typescript
interface Action {
  name: string; // "Scimitar", "Fire Breath"
  type: 'melee' | 'ranged' | 'spell' | 'utility';
  toHit?: number; // Pre-calculated or Override
  reach?: number;
  damage?: {
    dice: string; // "1d6"
    bonus: number; // 2
    type: string; // "slashing"
  }[];
  save?: {
    stat: string; // "dex"
    dc: number; // 13
  };
  area?: {
    shape: 'line' | 'cone' | 'cube' | 'sphere' | 'circle' | 'cylinder'; // circle/sphere are often interchangeable, line, cone
    size: number; // length/radius in feet (e.g., 60 for 60-ft cone)
    width?: number; // For lines (e.g., 5 ft wide)
  };
  duration?: 'instantaneous' | 'concentration' | '1_minute' | '10_minutes' | '1_hour';
  description?: string; // Fluff text
}
```

## Unification Strategy

1.  **For Characters**:
    - `ActionEngine` iterates Inventory.
    - Generates `Action` objects dynamically based on equipped weapon + stats.
2.  **For Monsters**:
    - **Short term**: Display the text.
    - **Long term (AI/Parser)**: We must run a migration that parses the standard 5e action string format and converts it into the `Action` schema.
    - **Hybrid**: Allow `Monster` blueprints to have a `structuredActions` component (new) that overrides the legacy `actions` JSON.

This is critical for the "Tactical Engine" to eventually support automated monster turns.
