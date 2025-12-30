# Tool Name: `interact_object`

**Category**: Exploration  
**Engine Layer**: ActionDispatcher & Persistence

## 1. Introduction

The `interact_object` tool allows entities to manipulate the world state beyond movement and combat. This covers standard "Object Interactions" (Doors, Chests) and complex mechanics (Levers, Puzzles).

## 2. Use Case

- A Rogue attempts to pick the lock of a Chest.
- A Player opens a wooden door to reveal a room.
- A Monster pulls a lever to drop a portcullis.

## 3. Tool Definition (Schema)

```typescript
interface InteractObjectInput {
  actorId: string;
  targetObjectId: string; // ID of the Prop/Furniture
  interactionType: 'open' | 'close' | 'lock' | 'unlock' | 'toggle' | 'loot';
  toolId?: string; // Optional: Thieves Tools ID for 'unlock'
  keyId?: string; // Optional: Key Item ID
}
```

## 4. Expected Results

- **Validation**:
  - **Range Check**: Must be adjacent (Reach 5ft).
  - **State Check**: Cannot 'open' a 'locked' door without 'unlock' first.
  - **Skill Check**: If locked/trapped, triggers `SKILL_CHECK` (Thieves Tools) automatically.
- **State Change**:
  - Updates Object State (e.g., `Door.isOpen = true`).
  - Updates Voxel Map (e.g., Door tile becomes passable navigation-wise).
- **Events**:
  - `OBJECT_STATE_CHANGED`: Triggers visual update (Door animation).
  - `LOOT_GENERATED`: If opening a chest, might spawn Item entities.

## 5. Implementation Locations

- **Backend**: `PropService` / `RoomService`.
- **Shared Engine**: `InteractionRules` (DC checks).
