# Tool Name: `move_entity`

**Category**: Exploration  
**Engine Layer**: Physics & Voxel Engine

## 1. Introduction

The `move_entity` tool executes deterministic movement on the grid. It is responsible for path validation (walls, difficult terrain), speed tracking (Movement Budget), and triggering spatial events (Traps, Opportunity Attacks).

## 2. Use Case

- Player clicks a destination tile during their turn.
- Monster AI decides to flank a player.
- An NPC patrols a route.

## 3. Tool Definition (Schema)

```typescript
interface MoveEntityInput {
  entityId: string;
  path: { x: number; y: number; z: number }[]; // Array of coordinates
  mode?: 'walk' | 'fly' | 'swim' | 'burrow'; // Default 'walk'
  costOverride?: number; // For DM fiat moves
}
```

## 4. Expected Results

- **Validation**:
  - Verifies `path` continuity (adjacent tiles).
  - Checks collision with Terrain (Walls) and other Entities.
  - Checks `Movement Speed` budget (unless DM override).
- **Execution**:
  - Updates `Entity.position` step-by-step.
  - **Trigger Check**: At each step, checks for `Hidden Entities` (Traps) or `Engagement` (Opportunity Attack zones).
- **State Change**:
  - Updates `position`.
  - Deducts from `TurnMovementBudget`.
- **Events**:
  - `ENTITY_MOVED`: Broadcasts new coords for frontend animation.

## 5. Implementation Locations

- **Shared Engine**: `MovementValidator` (Voxel collision logic).
- **Backend**: `ActionEngine` -> `handleMove`.
