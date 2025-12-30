# 01. Proficiencies: Structure & Unification

## The Disparity

### Monster (Current)

Stored as a JSON object, often mirroring the API response:

```json
"proficiencies": [
  { "name": "Skill: Stealth", "value": 6 },
  { "name": "Saving Throw: Dex", "value": 3 }
]
```

Or sometimes just a string map. It's inconsistent and requires regex to parse during combat (e.g., checking if a monster is proficient in perception).

### Character (Current)

Stored as **Relations**.

- `Class` gives Saving Throw proficiencies.
- `Background` gives Skill proficiencies.
- `Race` creates specific bonuses.
- The Engine calculates the actual bonus: `(Attribute Mod + PB)`.

## The Standardized "Unified Sheet" Model

The `CharacterSheet` should not care about the source. It needs a flattened set of **Tags**.

### Proposed Structure (Engine/Sheet)

```typescript
interface Proficiencies {
  // Saves
  savingThrows: string[]; // ['dex', 'con']

  // Skills
  skills: string[]; // ['stealth', 'perception']

  // Tools & Weapons (Often overlooked for monsters, critical for players)
  tools: string[];
  weapons: string[]; // ['simple', 'martial', 'scimitar']
  armor: string[]; // ['light', 'medium']
}
```

## Unification Strategy

1.  **For Characters**: The current derivation logic works. We keep it.
2.  **For Monsters**: We need to **parse and explode** the JSON blob during the `spawnMonster` phase or migration.
    - If `proficiencies` contains "Skill: Stealth", add "stealth" to `sheet.stats.skills`.
    - If "Saving Throw: Dex", add "dex" to `sheet.stats.saves`.

**Critical Decision**:
Do we store the _value_ (+6) or the _proficiency_ (boolean)?

- **Decision**: Store the **Proficiency (boolean)** tag.
- **Reasoning**: The Engine manages the Math. If a Goblin has DEX 14 (+2) and is Proficient (+2), the total is +4. If the generic monster text says "+6", it might mean "Expertise". We should treat explicit monster values as **overrides** or handle them via "Expertise" tags if the math doesn't check out.
