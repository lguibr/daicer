# Tool Name: `roll_save`

**Category**: System & Meta  
**Engine Layer**: ActionDispatcher (SkillCheck)

## 1. Introduction

The `roll_save` tool forces an entity to make a Saving Throw. Unlike `request_check` (which is often voluntary), `roll_save` is usually a reactive response to magic, traps, or environmental hazards.

## 2. Use Case

- A Fireball explodes: All entities in radius MUST roll a DEX Save.
- A Poison Dart hits: Victim MUST roll a CON Save.
- A Charm spell lands: Victim MUST roll a WIS Save.

## 3. Tool Definition (Schema)

```typescript
interface RollSaveInput {
  entityId: string;
  stat: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  difficultyClass: number; // DC to beat
  isMagic?: boolean; // Trigger Magic Resistance traits?
  damageContext?: string; // "poison", "fire" (for resistance checks)
  soak?: boolean; // Default false. If true, success = half damage, fail = full.
}
```

## 4. Expected Results

- **Execution**:
  - Calculates `d20 + Stat Mod + Proficiency (if has Save Prof)`.
  - Checks `Magic Resistance` trait (Advantage).
- **Outcome**:
  - **Success**: Returns `success: true`. If `soak=true`, implies half damage.
  - **Failure**: Returns `success: false`. Full effect applies.
- **Events**:
  - `SAVE_RESULT`: "Topher rolls 15 (Success) against DC 12 Fireball."

## 5. Implementation Locations

- **Backend**: `ActionEngine` -> `handleSkillCheck` (reused logic).
- **Shared Engine**: `Rules.calculateSaveModifier`.
