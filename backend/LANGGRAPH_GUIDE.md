# LangGraph Usage Guide for D20 AI

This guide explains how we use LangGraph v1 in the D20 AI project for game orchestration and combat management.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Patterns](#core-patterns)
4. [Combat System](#combat-system)
5. [Determinism & Time-Travel](#determinism--time-travel)
6. [Best Practices](#best-practices)

## Overview

D20 AI uses **LangGraph v1** as the backbone for stateful game orchestration. The system is built on two main graphs:

- **Game Graph** (`src/graph/game-graph.ts`): Manages overall game flow (world generation, character creation, gameplay, combat)
- **Combat Graph** (`src/combat/graph.ts`): Manages tactical combat with time-travel and deterministic dice rolling

### Why LangGraph?

LangGraph provides critical features for D&D gameplay:

- **Durable execution**: Game state persists through failures
- **Checkpointing**: Every game state is saved for recovery and time-travel
- **Human-in-the-loop**: Combat requires player input at each turn
- **Streaming**: Real-time updates to players via Socket.io
- **Deterministic replay**: Combat can be rewound and replayed exactly

## Architecture

### State Management

All game state is defined using **Zod schemas** in `src/graph/state.ts`:

```typescript
import { GameStateSchema } from '@/graph/state';
import { StateGraph } from '@langchain/langgraph';

const graph = new StateGraph(GameStateSchema).addNode('my_node', nodeFunction).compile({ checkpointer });
```

### State Schema Structure

```typescript
const GameStateSchema = z.object({
  roomId: z.string(),
  phase: z.enum(['SETUP', 'CHARACTER_CREATION', 'GAMEPLAY', 'COMBAT']),
  players: z.array(PlayerSchema).register(registry, { reducer: ... }),
  messages: z.array(MessageSchema).register(registry, { reducer: ... }),
  combatState: CombatStateSchema.nullable(),
  // ... more fields
});
```

### Reducers

We use **reducers** to control how state updates are applied:

```typescript
// Append-only messages
messages: z.array(MessageSchema).register(registry, {
  reducer: {
    fn: (existing, newMessages) => existing.concat(newMessages),
  },
  default: () => [],
}),

// Upsert players by ID
players: z.array(PlayerSchema).register(registry, {
  reducer: {
    fn: (existing, updates) => {
      const playerMap = new Map(existing.map(p => [p.id, p]));
      updates.forEach(update => playerMap.set(update.id, update));
      return Array.from(playerMap.values());
    },
  },
  default: () => [],
}),
```

## Core Patterns

### Pattern 1: Nodes as State Transformers

Nodes receive state and return partial updates:

```typescript
export async function worldGenerationNode(state: GameState): Promise<Partial<GameState>> {
  const worldDescription = await generateWorldTask({
    theme: state.settings.theme,
    // ... other params
  });

  return {
    worldDescription,
    phase: 'CHARACTER_CREATION', // Transition to next phase
  };
}
```

### Pattern 2: Tasks for Determinism

**CRITICAL**: Wrap all LLM calls and dice rolls in `task()` for deterministic replay:

```typescript
import { task } from '@langchain/langgraph';

// ✅ CORRECT: LLM call wrapped in task
const generateWorldTask = task('generateWorld', async (params: WorldParams): Promise<string> => {
  return await generateText(systemPrompt, userPrompt, params.language);
});

// ❌ WRONG: Direct LLM call in node
async function worldGenerationNode(state: GameState) {
  // This will break time-travel/replay!
  const result = await generateText(system, prompt, lang);
  return { worldDescription: result };
}
```

### Why Tasks Matter

When you resume a workflow (e.g., after an interrupt or error):

- LangGraph re-executes the node **from the beginning**
- Tasks that already ran are **retrieved from checkpoints** instead of re-executed
- This ensures **deterministic replay** and **idempotency**

### Pattern 3: Conditional Edges for Routing

```typescript
.addConditionalEdges(START, (state) => {
  switch (state.phase) {
    case 'SETUP':
      return 'world_generation';
    case 'CHARACTER_CREATION':
      return 'character_openings';
    case 'GAMEPLAY':
    case 'COMBAT':
      return 'combat_check';
    default:
      return 'combat_check';
  }
})
```

### Pattern 4: Checkpointing with Firestore

We implemented a custom `FirestoreCheckpointer` that persists state to Firestore:

```typescript
import { FirestoreCheckpointer } from '@/graph/firestore-checkpointer';

const checkpointer = new FirestoreCheckpointer();
const graph = builder.compile({ checkpointer });
```

**Storage location**: `rooms/{roomId}/checkpoints/{checkpoint_id}`

**Thread ID = Room ID**: Each game room is a separate thread

```typescript
await graph.invoke(input, {
  configurable: {
    thread_id: roomId, // Room ID is the thread
  },
});
```

## Combat System

### Combat as Tools for DM Agent

Combat actions are exposed as **LangChain tools** that the DM (LLM) can call:

```typescript
import { combatTools } from '@/combat/tools';

const tools = [
  ...combatTools, // start_combat, combat_attack, combat_move, end_turn, end_combat
  ...otherDMTools,
];

const dmAgent = model.bindTools(tools);
```

### Combat Tool Pattern

Each tool wraps combat graph operations:

```typescript
export const attackTool = tool(
  async (input, config) => {
    const roomId = config.configurable?.roomId;
    const session = getCombatSession(roomId);

    // Execute attack via combat session
    const updatedState = await session.attack(input.attackerId, input.targetId, { weaponDamage: input.weaponDamage });

    // Return Command to update game state
    return new Command({
      update: {
        combatState: updatedState,
      },
    });
  },
  { name: 'combat_attack', schema: AttackSchema }
);
```

### Deterministic Combat

Combat uses **seeded dice rolling** to ensure deterministic results:

```typescript
import { DiceRoller } from '@/combat/dice';

// Create roller with seed
const diceRoller = new DiceRoller({ seed: 42, enableHistory: true });

// All rolls are deterministic
const attack1 = diceRoller.rollAttack(5); // Always same result with seed 42
const damage1 = diceRoller.rollDamage('1d8', 3);

// History is tracked
const history = diceRoller.getHistory(); // All rolls preserved
```

### Time-Travel in Combat

Combat sessions maintain full state history:

```typescript
const session = createCombatSession('session-id', seed);

// Execute combat actions
await session.startCombat(characters);
await session.attack('fighter-1', 'goblin-1');

// Get history
const history = session.getHistory();

// Restore to previous state
await session.restoreState(historyIndex);

// Fork from a state (creates new branch)
await session.forkFromState(historyIndex);
```

## Determinism & Time-Travel

### Critical Rules for Determinism

#### Rule 1: Wrap Non-Deterministic Operations

```typescript
// ✅ CORRECT
const rollDiceTask = task('rollDice', async (notation: string) => {
  const roller = new DiceRoller({ seed: Date.now() });
  return roller.roll(notation);
});

// ❌ WRONG
async function myNode(state) {
  const roller = new DiceRoller({ seed: Date.now() }); // Different each time!
  const result = roller.roll('1d20');
  return { result };
}
```

#### Rule 2: Use Idempotent Operations Before Interrupts

If you place side effects before an interrupt, they must be idempotent:

```typescript
// ✅ GOOD: Idempotent upsert
async function approvalNode(state) {
  await db.upsertRecord({ id: state.id, status: 'pending' });
  const approved = interrupt('Approve?');
  return { approved };
}

// ❌ BAD: Non-idempotent create
async function approvalNode(state) {
  await db.createRecord({ status: 'pending' }); // Duplicate on resume!
  const approved = interrupt('Approve?');
  return { approved };
}
```

#### Rule 3: Do Not Wrap `interrupt()` in try/catch

```typescript
// ✅ CORRECT
async function reviewNode(state) {
  const review = interrupt('Please review');
  try {
    await saveToDatabase(review);
  } catch (err) {
    console.error(err);
  }
  return { review };
}

// ❌ WRONG
async function reviewNode(state) {
  try {
    const review = interrupt('Please review'); // Will catch interrupt exception!
  } catch (err) {
    console.error(err);
  }
  return {};
}
```

### State Streaming

Stream state updates to clients in real-time:

```typescript
import { streamGameGraph } from '@/graph/game-graph';

for await (const [mode, chunk] of streamGameGraph(roomId, input)) {
  if (mode === 'updates') {
    io.to(roomId).emit('game:state_update', chunk);
  }
  if (mode === 'custom') {
    io.to(roomId).emit('game:custom_event', chunk);
  }
}
```

### Custom Streaming from Nodes

Emit custom data during execution:

```typescript
import { LangGraphRunnableConfig } from '@langchain/langgraph';

async function processTurnNode(state: GameState, config: LangGraphRunnableConfig): Promise<Partial<GameState>> {
  config.writer?.('Processing player actions...'); // Custom event

  const result = await llmTask(state.playerActions);

  config.writer?.({ type: 'progress', value: 100 }); // Custom event

  return { messages: result };
}
```

## Best Practices

### 1. Always Use Thread IDs

Every graph invocation must include a thread ID (room ID):

```typescript
await graph.invoke(input, {
  configurable: {
    thread_id: roomId,
  },
});
```

### 2. Use Partial State Updates

Nodes only return fields they modify:

```typescript
// ✅ CORRECT
return {
  messages: newMessages,
  phase: 'GAMEPLAY',
};

// ❌ WRONG
return {
  ...state,
  messages: newMessages,
  phase: 'GAMEPLAY',
};
```

### 3. Handle Errors in Nodes

```typescript
async function myNode(state: GameState): Promise<Partial<GameState>> {
  try {
    const result = await someTask();
    return { result };
  } catch (error) {
    logger.error('Error in node:', error);
    return {
      messages: [
        {
          id: `error-${Date.now()}`,
          sender: 'DM',
          text: 'An error occurred. Please try again.',
          timestamp: Date.now(),
        },
      ],
    };
  }
}
```

### 4. Test with Fixed Seeds

Always test combat/dice logic with fixed seeds:

```typescript
it('should produce deterministic results', () => {
  const session1 = createCombatSession('test', 42);
  const session2 = createCombatSession('test', 42);

  const state1 = await session1.startCombat(characters);
  const state2 = await session2.startCombat(characters);

  expect(state1.turnOrder).toEqual(state2.turnOrder);
});
```

### 5. Use Type Guards

```typescript
export function hasActiveCombat(state: GameState): boolean {
  return state.combatState !== null && !state.combatState.isCombatOver;
}

export function isInCombat(state: GameState): boolean {
  return state.phase === 'COMBAT';
}
```

## Common Pitfalls

### Pitfall 1: Forgetting to Wrap LLM Calls

```typescript
// ❌ BREAKS TIME-TRAVEL
async function dmNode(state) {
  const response = await llm.invoke(prompt); // Not wrapped!
  return { response };
}

// ✅ CORRECT
const generateResponseTask = task('generateResponse', async (prompt) => {
  return await llm.invoke(prompt);
});

async function dmNode(state) {
  const response = await generateResponseTask(state.prompt);
  return { response };
}
```

### Pitfall 2: Mutating State

```typescript
// ❌ WRONG
function myNode(state: GameState) {
  state.messages.push(newMessage); // Mutation!
  return state;
}

// ✅ CORRECT
function myNode(state: GameState) {
  return {
    messages: [...state.messages, newMessage],
  };
}
```

### Pitfall 3: Non-Serializable State

```typescript
// ❌ WRONG
return {
  callback: () => console.log('hi'), // Functions not serializable!
  instance: new MyClass(), // Class instances not serializable!
};

// ✅ CORRECT
return {
  result: 'hi',
  data: { key: 'value' },
};
```

## Example: Complete Combat Flow

```typescript
import { invokeGameGraph } from '@/graph/game-graph';
import { getCombatSession } from '@/combat/tools';

// 1. Player submits "I attack the goblin"
const gameState = await invokeGameGraph(roomId, {
  ...currentState,
  players: updatedPlayersWithActions,
});

// 2. DM agent processes turn, detects combat
// 3. DM calls start_combat tool
// Tool creates combat session and updates state

// 4. Combat session manages tactical grid
const session = getCombatSession(roomId);
await session.startCombat(characters);

// 5. Players take tactical actions
await session.attack('fighter-1', 'goblin-1', {
  weaponDamage: '1d8',
  damageType: 'slashing',
});

// 6. State is checkpointed after each action

// 7. Time-travel available
const history = session.getHistory();
await session.restoreState(previousIndex);

// 8. Combat ends, state returns to game graph
const finalState = await invokeGameGraph(roomId, {
  phase: 'GAMEPLAY',
  combatState: null,
});
```

## Reference

### Key LangGraph Concepts

- **StateGraph**: Main graph class, parameterized by state schema
- **task()**: Wraps functions for checkpointing and determinism
- **Nodes**: Functions that transform state
- **Edges**: Define control flow between nodes
- **Checkpointer**: Persists state for durability
- **Thread ID**: Unique identifier for a workflow instance (room ID)

### Key Files

- `src/graph/state.ts`: All Zod schemas
- `src/graph/game-graph.ts`: Main game orchestration
- `src/graph/firestore-checkpointer.ts`: Persistence layer
- `src/graph/nodes/*.ts`: Individual graph nodes
- `src/combat/graph.ts`: Combat-specific graph
- `src/combat/tools.ts`: Combat tools for DM agent
- `src/combat/dice.ts`: Deterministic dice roller

### Further Reading

For more LangGraph patterns and examples, see:

- LangGraph JS Documentation: https://langchain-ai.github.io/langgraphjs/
- Durable Execution: https://langchain-ai.github.io/langgraphjs/concepts/durable_execution
- Human-in-the-Loop: https://langchain-ai.github.io/langgraphjs/concepts/interrupts
- Streaming: https://langchain-ai.github.io/langgraphjs/concepts/streaming
- Time Travel: https://langchain-ai.github.io/langgraphjs/how-tos/time-travel

## Debugging

### Enable LangSmith Tracing

```typescript
process.env.LANGCHAIN_TRACING_V2 = 'true';
process.env.LANGCHAIN_API_KEY = 'your-api-key';
```

### View Checkpoints

```typescript
const state = await graph.getState({ configurable: { thread_id: roomId } });
console.log(state.values); // Current state
console.log(state.next); // Next nodes to execute

// View history
for await (const checkpoint of graph.getStateHistory({ configurable: { thread_id: roomId } })) {
  console.log(checkpoint.values);
}
```

### Inspect Combat State

```typescript
const session = getCombatSession(roomId);
const state = session.getState();
const history = session.getHistory();
const diceHistory = session.getDiceHistory();

console.log('Active character:', session.getActiveCharacter());
console.log('Combat log:', session.getLog());
```

## Summary

LangGraph enables D20 AI to provide:

- **Persistent game state** across sessions
- **Deterministic combat** with time-travel
- **Tool-based combat** for LLM agents
- **Streaming updates** for real-time gameplay
- **Checkpointing** for recovery and exploration

Always remember: **Wrap LLM calls and dice rolls in `task()`** to maintain determinism!
