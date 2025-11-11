# Graph Architecture Documentation

This document provides a comprehensive overview of the LangGraph-based game orchestration system in D20 AI.

## Table of Contents

1. [Overview](#overview)
2. [Gameplay Graph](#gameplay-graph)
3. [Combat Graph](#combat-graph)
4. [State Management](#state-management)
5. [Nodes](#nodes)
6. [Tool Calls](#tool-calls)
7. [Flow Diagrams](#flow-diagrams)

## Overview

D20 AI uses **LangGraph** as its core orchestration engine for managing game state and flow. The system is built around two main graphs:

- **Gameplay Graph** (`src/graph/gameplay-graph.ts`): Manages narrative gameplay
- **Combat Graph** (`src/combat/graph.ts`): Manages tactical combat with time-travel

Both graphs use deterministic execution patterns to ensure reproducible gameplay and support features like time-travel in combat.

## Gameplay Graph

### Purpose

Orchestrates turn-based narrative gameplay where players interact with the world, NPCs, and each other through natural language actions.

### Graph Structure

```
START
  ↓
combat_check ←────┐
  ↓               │
  ├─ (has actions?) → turn_processing ─┘
  │
  └─ (no actions/waiting) → END
```

### Nodes

#### 1. combat_check (Combat Coordinator Node)

**File**: `src/graph/nodes/combat-coordinator.ts`

**Purpose**: Acts as a state validator and flow controller

**Inputs**: Full GameplayState

**Outputs**:

- `waitingForAction: boolean` - Signals if graph should pause
- Potentially modified state based on combat triggers

**Logic**:

1. Checks if players have submitted actions
2. Evaluates if combat should be triggered (future feature)
3. Sets `waitingForAction` flag appropriately

#### 2. turn_processing (Turn Processing Node)

**File**: `src/graph/nodes/turn-processing.ts`

**Purpose**: Processes player actions and generates DM responses

**Inputs**:

- GameplayState with player actions
- Language setting from room

**Outputs**:

- New messages (summary + player perspectives)
- Updated players with cleared actions

**Logic**:

1. Collects all player action messages
2. Calls processTurn service with LLM
3. Generates:
   - Overall summary for all players
   - Individual perspectives for each player (private messages)
4. Clears player actions after processing

**LLM Integration**:

- Uses structured output with Zod schema
- Calls tools for dice rolls, checks, etc.
- Injects language-specific prompts

### State Flow

```typescript
// Initial state (players submitted actions)
{
  roomId: "abc123",
  players: [
    { id: "p1", action: "I search the room", ... },
    { id: "p2", action: "I examine the door", ... }
  ],
  messages: [...previous messages],
  waitingForAction: false
}

// After turn_processing
{
  roomId: "abc123",
  players: [
    { id: "p1", action: null, ... },  // Cleared
    { id: "p2", action: null, ... }   // Cleared
  ],
  messages: [
    ...previous,
    { sender: "Player1", text: "I search the room" },
    { sender: "Player2", text: "I examine the door" },
    { sender: "DM", text: "As you search...", recipientId: null },
    { sender: "DM", text: "You notice...", recipientId: "p1" },
    { sender: "DM", text: "The door feels...", recipientId: "p2" }
  ],
  waitingForAction: true  // Set by combat_check on next iteration
}
```

## Combat Graph

### Purpose

Manages tactical grid-based combat with deterministic dice rolling and time-travel capabilities.

### Graph Structure

```
START
  ↓
initiative
  ↓
turn_start ←──────┐
  ↓               │
  ├─ (combat over?) → END
  │
  └─ (active) → action_selection
                    ↓
                turn_end ─┘
```

### Key Features

#### Deterministic Dice Rolling

- Uses seeded random number generator
- All rolls are reproducible with the same seed
- Enables time-travel by replaying from a seed

#### Combat Session

```typescript
class CombatSession {
  - state: CombatState
  - diceRoller: DiceRoller (seeded)
  - stateHistory: Array<snapshot>

  // Methods
  - startCombat(characters)
  - moveCharacter(id, position)
  - attack(attacker, defender, options)
  - endTurn()
  - restoreState(historyIndex)  // Time-travel
  - forkFromState(historyIndex)  // Branch timeline
}
```

### Nodes

#### 1. initiative (Initiative Node)

**File**: `src/combat/nodes/InitiativeNode.ts`

**Purpose**: Rolls initiative for all characters and establishes turn order

**Inputs**: Array of CombatCharacters

**Outputs**:

- `turnOrder`: Sorted array of character IDs
- `round`: Set to 1
- `phase`: Set to 'in_progress'

**Logic**:

1. Roll d20 + Dexterity modifier for each character
2. Sort by initiative (highest first)
3. Set first character as active

#### 2. turn_start (Turn Start Node)

**File**: `src/combat/nodes/TurnStartNode.ts`

**Purpose**: Begins a character's turn

**Outputs**:

- Increment round if first character in turn order
- Add turn start log entry

#### 3. turn_end (Turn End Node)

**File**: `src/combat/nodes/TurnEndNode.ts`

**Purpose**: Ends a character's turn and advances to next

**Outputs**:

- `activeCharacterId`: Next character in turn order
- `isCombatOver`: true if all enemies/players defeated
- `winner`: 'player' or 'enemy' if combat over

#### 4. move (Move Node)

**File**: `src/combat/nodes/MoveNode.ts`

**Purpose**: Moves a character on the combat grid

**Inputs**:

- Character ID
- Target position (x, y)

**Outputs**:

- Updated character position
- Movement cost (based on difficult terrain, etc.)
- Opportunity attack triggers

#### 5. attack (Attack Node)

**File**: `src/combat/nodes/AttackNode.ts`

**Purpose**: Resolves an attack action

**Inputs**:

- Attacker ID
- Defender ID
- Weapon damage notation
- Attack options (finesse, ranged, etc.)

**Outputs**:

- Attack roll result
- Damage dealt
- Updated HP
- Combat log entry

**Logic**:

1. Roll attack: d20 + attack bonus
2. Compare to defender's AC
3. If hit, roll damage dice
4. Apply damage to defender
5. Check if defender drops to 0 HP

## State Management

### Gameplay State Schema

```typescript
const GameplayStateSchema = z.object({
  roomId: z.string(),
  ownerId: z.string(),
  phase: z.enum(['SETUP', 'CHARACTER_CREATION', 'GAMEPLAY', 'COMBAT']),
  settings: WorldSettingsSchema.nullable(),
  worldDescription: z.string(),
  language: z.enum(['en', 'es', 'pt-BR']),

  players: z.array(PlayerSchema),
  messages: z.array(MessageSchema),
  creatures: z.array(CreatureSchema),

  waitingForAction: z.boolean(),
});
```

### Combat State Schema

```typescript
const CombatStateSchema = z.object({
  sessionId: z.string(),
  characters: z.array(CombatCharacterSchema),

  turnOrder: z.array(z.string()), // Character IDs in order
  activeCharacterId: z.string().nullable(),
  round: z.number(),

  gridWidth: z.number(),
  gridHeight: z.number(),

  phase: z.enum(['setup', 'in_progress', 'complete']),
  isCombatOver: z.boolean(),
  winner: z.enum(['player', 'enemy']).nullable(),

  log: z.array(CombatLogEntrySchema),
  diceHistory: z.array(DiceRollSchema),
  diceRollerSeed: z.number(),

  pendingOpportunityAttacks: z.array(OpportunityAttackSchema),
});
```

## Nodes

All nodes follow this pattern:

```typescript
async function myNode(state: GameState, config?: LangGraphRunnableConfig): Promise<Partial<GameState>> {
  // 1. Read from state
  const { players, messages } = state;

  // 2. Perform logic
  const result = await someOperation();

  // 3. Return partial state update
  return {
    messages: [...messages, newMessage],
    someField: updatedValue,
  };
}
```

### Important Patterns

#### State Reducers

Messages use append-only reducer:

```typescript
messages: z.array(MessageSchema).register(registry, {
  reducer: {
    fn: (existing, newMessages) => existing.concat(newMessages),
  },
  default: () => [],
});
```

Players use upsert reducer (by ID):

```typescript
players: z.array(PlayerSchema).register(registry, {
  reducer: {
    fn: (existing, updates) => {
      const playerMap = new Map(existing.map((p) => [p.id, p]));
      updates.forEach((update) => playerMap.set(update.id, update));
      return Array.from(playerMap.values());
    },
  },
  default: () => [],
});
```

#### Task Wrapping

All non-deterministic operations MUST be wrapped in `task()`:

```typescript
import { task } from '@langchain/langgraph';

const processTurnTask = task('processGameTurn', async (params) => {
  return await processTurnService(...params);
});

// In node
async function myNode(state) {
  const result = await processTurnTask(state.params);
  return { result };
}
```

## Tool Calls

Tools are exposed to the LLM for game mechanics:

### Available Tools

- `roll_dice`: Roll any dice notation (1d20, 2d6+3, etc.)
- `attribute_check`: Make attribute check (d20 + modifier vs DC)
- `saving_throw`: Make saving throw
- `attack_roll`: Make attack roll
- `deal_damage`: Roll and apply damage

### Tool Notification System

When tools are called:

1. Backend logs tool call with parameters and result
2. Socket emits `tool:calls` event to room
3. Frontend displays toast notification
4. Full history available in ToolsPanel

## Flow Diagrams

### Complete Turn Processing Flow

```
Player submits action
      ↓
Socket handler receives action
      ↓
Update Firestore player.action
      ↓
Emit room:updated event
      ↓
Check if all players have actions
      ↓
   YES → Invoke gameplay graph
      ↓
Graph: START → combat_check
      ↓
combat_check: Has actions?
      ↓
   YES → turn_processing
      ↓
turn_processing:
  - Build context (messages, players, world)
  - Call processTurn with LLM
  - LLM may call tools (roll_dice, etc.)
  - Generate structured response:
      * overall_summary
      * player_perspectives[]
  - Create message objects
  - Clear player actions
      ↓
Loop to combat_check
      ↓
combat_check: Has actions?
      ↓
   NO → Set waitingForAction = true
      ↓
Graph: END
      ↓
Socket: Emit tool:calls (if any)
Socket: Emit turn:complete
      ↓
Frontend: Update UI
Frontend: Show tool notifications
```

### Combat Session Flow

```
DM triggers combat
      ↓
Create CombatSession(seed)
      ↓
session.startCombat(characters)
      ↓
Initiative rolls (deterministic)
      ↓
Turn order established
      ↓
┌─────────────────────┐
│  Active Character   │
│       Turn          │
└─────────────────────┘
      ↓
Player/DM chooses action:
  - Move
  - Attack
  - Cast Spell
  - End Turn
      ↓
Execute action node
      ↓
Record in state history
      ↓
session.endTurn()
      ↓
Next character active
      ↓
Check if combat over
      ↓
   NO → Loop to next turn
   YES → Determine winner
      ↓
Return to gameplay
```

### Time-Travel in Combat

```
Combat in progress
  Round 3, Character 2
      ↓
Player: "I want to go back to Round 2"
      ↓
session.getHistory()
  → Returns all state snapshots
      ↓
session.restoreState(historyIndex: 5)
  → Loads state from snapshot 5
  → Resets dice roller to that seed
      ↓
Combat continues from Round 2
  All subsequent rolls deterministic
```

## Summary

The D20 AI graph architecture provides:

- **Deterministic execution** via task wrapping and seeded dice
- **Persistent state** via Firestore checkpointing
- **Real-time updates** via Socket.io events
- **Tool transparency** via notification system
- **Time-travel** in combat sessions
- **Multi-language support** via language injection in prompts

For more details on LangGraph patterns, see `LANGGRAPH_GUIDE.md`.
