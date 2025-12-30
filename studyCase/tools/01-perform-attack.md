# Tool Name: `perform_attack`

**Category**: Combat  
**Engine Layer**: ActionDispatcher

## 1. Introduction

The `perform_attack` tool is the fundamental unit of D&D 5e combat. It resolves a single attack roll (d20 + modifiers) against a target's Armor Class (AC), and if successful, calculates and applies damage.

## 2. Use Case

- The Agent controls a Goblin who fires a shortbow at a Player.
- The Agent controls a Paladin who strikes a spectral entity with a magic sword.
- A Trap triggers an attack roll against a passing creature.

## 3. Tool Definition (Schema)

```typescript
interface PerformAttackInput {
  attackerId: string; // Document ID of the entity attacking
  targetId: string; // Document ID of the entity being attacked
  actionName?: string; // Optional: Specific action name (e.g., "Shortsword")
  // If omitted, defaults to "Unarmed Strike" or primary weapon
  advantage?: boolean; // Forced advantage (e.g., from Hiding)
  disadvantage?: boolean; // Forced disadvantage
  manualRoll?: number; // Debug/fiat override for the d20 roll
}
```

## 4. Expected Results

- **Calculations**:
  - Validates `attacker` and `target` existence.
  - Retrieves `EntityAction` stats (toHit, damage dice).
  - Rolls `1d20 + toHit`. Checks vs `Target.AC`.
  - On Hit: Rolls Damage Dice. On Crit (Natural 20): Rolls Damage Dice x2.
- **State Change**:
  - Decrements `Target.hp`.
  - Checks for Death (0 HP) and updates status to `Unconscious/Dead`.
- **Events**:
  - Emits `ATTACK_RESULT` event (visible in Game Log).
  - Emits `ENTITY_DAMAGED` event.

## 5. Implementation Locations

- **Frontend**: `ActionPalette` -> Click "Attack" -> Select Target.
- **Backend Service**: `api::game.action-engine` -> `dispatch`.
- **Shared Engine**: `ActionDispatcher.handleAttack`.
