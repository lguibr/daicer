# Graph States - Section Graph Schemas

**Purpose:** Isolated state schemas for DAICE's three wizard sections with explicit dependency validation and merge logic.

## Overview

This package provides type-safe Zod schemas for the redesigned LangGraph architecture where each wizard section has its own independent graph.

## Schemas

### Section 1: DM Story (`dm-story-state.ts`)

**Purpose:** Generate world history, conditions, and narrative seed

**Dependencies:** None (first section)

**Exports:**

- `DMStoryStateSchema` - Full state for dm_story_graph
- `DMStoryInputSchema` - API request schema (required fields only)
- `DMStoryOutputSchema` - API response schema (guarantees worldHistory, conditions, historyPeriods)

**Usage:**

```typescript
import { DMStoryInputSchema, type DMStoryOutput } from '@daicer/shared/graph-states';

// Validate API request
const input = DMStoryInputSchema.parse(req.body);

// After graph execution
const output: DMStoryOutput = {
  roomId: input.roomId,
  worldHistory: result.worldHistory,
  conditions: result.conditions,
  historyPeriods: result.historyPeriods,
};
```

### Section 2: World Config (`world-config-state.ts`)

**Purpose:** Generate physical world (structures, roads, terrain, chunks)

**Dependencies:** Requires Section 1 output (historyPeriods, conditions, worldHistory)

**Exports:**

- `WorldConfigStateSchema` - Full state for world_config_graph
- `WorldConfigInputSchema` - API request schema (enforces Section 1 dependencies)
- `WorldConfigOutputSchema` - API response schema (guarantees structures, worldDescription)

**Usage:**

```typescript
import { WorldConfigInputSchema, type WorldConfigOutput } from '@daicer/shared/graph-states';

// Validate API request (enforces Section 1 dependencies)
const input = WorldConfigInputSchema.parse({
  ...req.body,
  // Must include Section 1 outputs:
  historyPeriods: section1.historyPeriods,
  conditions: section1.conditions,
  worldHistory: section1.worldHistory,
});
```

### Section 3: Character Setup (`character-state.ts`)

**Purpose:** Generate personalized character opening narratives

**Dependencies:** Requires Section 1 (worldHistory) and Section 2 (worldDescription)

**Pattern:** Per-player invocation (not per-room)

**Exports:**

- `CharacterStateSchema` - Full state for character_setup_graph
- `CharacterInputSchema` - API request schema (enforces Section 1 & 2 dependencies)
- `CharacterOutputSchema` - API response schema (guarantees openingNarrative)

**Usage:**

```typescript
import { CharacterInputSchema, type CharacterOutput } from '@daicer/shared/graph-states';

// Per-player invocation
const input = CharacterInputSchema.parse({
  playerId: req.params.playerId,
  roomId: req.body.roomId,
  character: req.body.character,
  // Must include Section 1 & 2 outputs:
  worldHistory: section1.worldHistory,
  worldDescription: section2.worldDescription,
});
```

## State Merger Utility

### `mergeSectionOutputs()`

Combines validated outputs from all 3 sections into unified game state.

**Signature:**

```typescript
function mergeSectionOutputs(
  dmStory: DMStoryOutput,
  worldConfig: WorldConfigOutput,
  characters: CharacterOutput[]
): MergedGameState;
```

**Validation:**

- All inputs validated against output schemas (throws ZodError if invalid)
- Detects duplicate player IDs (throws Error)
- Validates Section 1 dependencies present in Section 2 input
- Validates Section 2 dependencies present in Section 3 input

**Usage:**

```typescript
import { mergeSectionOutputs } from '@daicer/shared/graph-states';

const section1Result = await dmStoryGraph.invoke(section1Input);
const section2Result = await worldConfigGraph.invoke({
  ...section2Input,
  ...section1Result, // Include dependencies
});

const characterResults = await Promise.all(
  players.map((p) =>
    characterSetupGraph.invoke({
      ...p,
      worldHistory: section1Result.worldHistory,
      worldDescription: section2Result.worldDescription,
    })
  )
);

// Merge all sections
const gameState = mergeSectionOutputs(section1Result, section2Result, characterResults);

// Save to Firestore
await saveGameState(gameState);
```

## Dependency Helpers

### `validateSection1Dependencies()`

Validates that Section 2 input contains required Section 1 outputs.

**Throws:** Error if historyPeriods, conditions, or worldHistory missing/invalid

### `validateSection2Dependencies()`

Validates that Section 3 input contains required Section 2 outputs.

**Throws:** Error if worldDescription missing/invalid

## Testing

All schemas have comprehensive unit tests:

- `dm-story-state.spec.ts` - 17 test cases
- `world-config-state.spec.ts` - 18 test cases
- `character-state.spec.ts` - 13 test cases
- `mergers.spec.ts` - 22 test cases

**Total: 70+ test cases covering:**

- Valid input acceptance
- Invalid input rejection
- Dependency validation
- Edge cases (zero players, empty arrays, etc.)
- Duplicate detection
- Boundary validation

## Import Paths

**From backend:**

```typescript
import { DMStoryStateSchema } from '@daicer/shared/graph-states';
import type { WorldConfigInput } from '@daicer/shared/graph-states';
```

**From frontend (types only):**

```typescript
import type { DMStoryOutput } from '@daicer/shared/graph-states';
import type { CharacterInput } from '@daicer/shared/graph-states';
```

## Type Safety

All schemas enforce TypeScript strict mode:

- No `any` types (except for terrainMap/gridState placeholders)
- Required vs optional fields clearly typed
- Input/output schemas prevent accidental field leakage
- Compile-time safety prevents cross-section coupling

## Next Steps

**Phase 2:** Use these schemas to create section graphs

```typescript
import { StateGraph } from '@langchain/langgraph';
import { DMStoryStateSchema } from '@daicer/shared/graph-states';

const dmStoryGraph = new StateGraph(DMStoryStateSchema)
  .addNode('init_world', initWorldNode)
  .addNode('generate_conditions', generateConditionsNode)
  // ...
  .compile();
```
