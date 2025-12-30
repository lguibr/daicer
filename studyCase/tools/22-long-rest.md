# Tool Name: `long_rest`

**Category**: System & Meta  
**Engine Layer**: CharacterLogic & Persistence

## 1. Introduction

The `long_rest` tool executes the D&D 5e Long Rest rules. It is a critical state-reset mechanism that restores Hit Points, Hit Dice, Spell Slots, and Ability Charges.

## 2. Use Case

- The Party sleeps at an Inn.
- The Party camps in the wilderness (and isn't ambushed).
- DM manually resets a character's state.

## 3. Tool Definition (Schema)

```typescript
interface LongRestInput {
  targetIds: string[]; // List of entities resting (usually whole party)
  timeRequired?: number; // Default 8 hours
}
```

## 4. Expected Results

- **Execution**:
  - **HP**: Sets `currentHp = maxHp`.
  - **Hit Dice**: Restores up to 50% of total Hit Dice.
  - **Slots**: Resets Spell Slots to maximum.
  - **Features**: Resets features marked `usage_per: 'long_rest'`.
  - **Condition Removal**: Reduces Exhaustion level by 1.
- **State Change**:
  - Updates DB for all targets.
  - Advances `WorldTime` by 8 hours.
- **Events**:
  - `REST_COMPLETED`: Visual feedback (Screen fade, resource bars fill).

## 5. Implementation Locations

- **Backend**: `api::game.rest-service` (New Service?).
- **Shared Engine**: `RestRules.calculateHitDiceRecovery`.
