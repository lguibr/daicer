# Tool Name: `spawn_entity`

**Category**: DM Management  
**Engine Layer**: SpawnService

## 1. Introduction

The `spawn_entity` tool creates a runtime instance (`CharacterSheet`) from a Blueprint (`Monster` or `Character`). It places the entity into the world at specific coordinates.

## 2. Use Case

- DM spawns a group of 3 Goblins to ambush the party.
- DM summons an NPC ally who just arrived.
- System spawns a "Summoned Creature" (e.g., _Spiritual Weapon_).

## 3. Tool Definition (Schema)

```typescript
interface SpawnEntityInput {
  blueprintId: string; // Document ID of the Monster/Character template
  type: 'monster' | 'npc' | 'player_character';
  position: { x: number; y: number; z: number };
  count?: number; // Batch spawn (default 1)
  faction?: 'friendly' | 'hostile' | 'neutral'; // Override default alignment
  nameOverride?: string; // Custom name (e.g., "Goblin Chief")
}
```

## 4. Expected Results

- **Execution**:
  - Fetches Blueprint.
  - Creates new `CharacterSheet` document(s) in the DB.
  - Links to current `Room`.
  - Sets `currentHp` to `maxHp` (or rolls Hit Dice).
  - Sets `position`.
- **State Change**:
  - Adds entity to `GameState.entities`.
- **Events**:
  - `ENTITY_SPAWNED`: Frontend loads the token asset and places it on the map.

## 5. Implementation Locations

- **Backend**: `api::game.spawn-service`.
- **Frontend**: Debug View -> "Summon" Palette.
