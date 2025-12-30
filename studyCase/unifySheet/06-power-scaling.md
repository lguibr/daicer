# 06. Power Scaling: CR vs. Level

## The Disparity

### Monster (Current)

- **Challenge Rating (CR)**: Determine XP and Proficiency Bonus (PB).
- **Hit Dice**: Determined by Size (d4 Tiny to d20 Gargantuan).
- **Proficiency Bonus**: Derived from CR lookup table.

### Character (Current)

- **Level**: Determines PB.
- **Hit Dice**: Determined by Class.
- **Experience (XP)**: Accumulates to gain Levels.

## The Standardized "Unified Sheet" Model

The Engine needs a normalized `Level` and `ProficiencyBonus`.

### Proposed Structure

```typescript
interface PowerLevel {
  level: number; // For Monsters, approximated from CR or Hit Dice count
  cr?: number; // Null for players
  proficiencyBonus: number; // The source of truth for all math
  xpValue: number; // Reward for killing this entity
}
```

## Unification Strategy

1.  **Monster PB Calculation**:

    - The Engine must calculate PB from CR: `max(2, floor((CR - 1) / 4) + 2)`.
    - _Example_: CR 1/4 -> PB +2. CR 5 -> PB +3.

2.  **Character PB Calculation**:
    - Standard 5e formula: `ceil(Level / 4) + 1`.
    - _Example_: Lvl 1 -> +2. Lvl 5 -> +3.

**Unified Getter**: `sheet.stats.proficiencyBonus`. The `CharacterDeriver` handles the divergence in logic, but the output field is identical.
