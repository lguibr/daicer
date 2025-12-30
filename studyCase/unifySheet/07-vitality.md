# 07. Vitality: Hit Points & Hit Dice

## The Disparity

### Monster (Current)

- `hp`: Integer (static average).
- `hit_dice`: String equation (e.g., `"2d6"` for Kobold).

### Character (Current)

- `currentHp` / `maxHp`: Integers.
- `hitDie`: Integer (e.g., `8` for d8) defined by Class.
- `level`: Determines count (e.g., Lvl 3 = 3d8).

## The Standardized "Unified Sheet" Model

We need to support both "Average HP" (for quick play) and "Rolled HP" (for boss monsters/players).

### Proposed Structure

```typescript
interface Vitality {
  current: number;
  max: number;
  temp: number;
  hitDice: {
    count: number;
    die: number; // 4, 6, 8, 10, 12, 20
    used: number; // Short rest tracking
  };
}
```

## Unification Strategy

1.  **For Monsters**:

    - Parser "2d6" -> `{ count: 2, die: 6 }`.
    - **Max HP**: Default to the static `monster.hp` value. Allow DM to "Roll for HP" which replaces `max` using the dice formula.

2.  **For Characters**:
    - `count` = `Level`.
    - `die` = `Class.hitDie`.
    - **Multiclassing Edge Case**: If we support multiclassing later, `hitDice` needs to become an array: `[{ count: 2, die: 10 }, { count: 3, die: 6 }]`. The unified schema should ideally start as an array to future-proof.

**Migration**: Existing legacy fields `currentHp` and `maxHp` on root of CharacterSheet can remain as the "active state", with the `Vitality` derivation handling the background math.
