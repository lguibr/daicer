# Tool Name: `cast_spell`

**Category**: Combat / Magic  
**Engine Layer**: ActionDispatcher & Narrative

## 1. Introduction

The `cast_spell` tool handles the complexity of magic users. It manages spell slots, component verification (V/S/M), range checks, and initializes the "Spell Resolution Loop" (which may trigger Saves, Attacks, or Area Effects).

## 2. Use Case

- A Wizard casts _Fireball_ (3rd Level) centered on a generic coordinate.
- A Cleric casts _Cure Wounds_ on an ally.
- A Lich casts _Power Word Kill_.

## 3. Tool Definition (Schema)

```typescript
interface CastSpellInput {
  casterId: string;
  spellId: string; // References `Spell` blueprint
  targetId?: string; // Single target spells
  targetPosition?: {
    // AoE spells
    x: number;
    y: number;
    z: number;
  };
  slotLevel?: number; // Upcasting logic (default: base spell level)
  consumeSlot?: boolean; // Default true. False for Innate/Cantrips.
}
```

## 4. Expected Results

- **Validation**:
  - Checks if `caster` has `spellId` prepared/known.
  - Checks if `caster` has available `slotLevel` resource.
- **Execution**:
  - Deducts Spell Slot.
  - **Attack Roll Spells** (e.g., _Scorching Ray_): Calls `perform_attack` logic internally or prompts for it.
  - **Save Spells** (e.g., _Fireball_): Emits `REQUEST_SAVE` events to all entities in `targetPosition` radius.
  - **Healing**: Applies HP restoration immediately.
- **State Change**:
  - Updates Resource Pools (Slots).
  - Updates HP (if healing/damage instant).
- **Feedback**:
  - "Wizard casts Fireball! 4 creatures must make DEX saves."

## 5. Implementation Locations

- **Backend**: `api::game.magic-system` (New Service needed?).
- **Shared Engine**: `SpellResolver` (Logic for AoE templates).
