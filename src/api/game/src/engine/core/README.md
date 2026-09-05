# Core engine

## Deterministic command kernel

`command-kernel.ts` exports the pure milestone boundary:

```ts
resolveCommandBatch({ state, commands, rules, terrain, rngState });
// { nextState, events, outcomes, nextRngState }

replayMechanicalEvents({ state, events, rngState });
// { nextState, nextRngState }
```

The module exports TypeScript contracts and strict Zod schemas for canonical state,
rules, terrain, commands, and mechanical events. Import it directly from
`@daicer/engine/core/command-kernel`. No Strapi, network, LLM, wall-clock, terrain
generation, or persistence dependencies are used. Dice reuse the shared `roll`
function with mandatory injected Alea randomness. The legacy dispatcher cannot be
called here because it mutates inputs, generates terrain, and timestamps outcomes.

### Contract and units

- `state.roomId` is Room `documentId`; `worldId` is World `documentId`. Entity `id`,
  command `actorId`, and attack `targetId` are room-specific EntitySheet IDs.
- Runtime vitality is explicit `hp`, `maxHp`, and `armorClass`. Application adapters
  map persisted `currentHp` and `ac` without truthy defaults. Zero HP remains zero.
- Positions are safe integer tile coordinates, including negative X/Y, and Z is
  an integer in `[-3, 3]`. Each actor occupies one tile. Larger footprints and
  fractional placement are unsupported in this milestone, not silently converted.
- `basic-v1` uses five feet per tile, cardinal same-plane walking, and Manhattan
  attack range. Cardinal paths cannot cut diagonal corners. Movement costs the
  full shortest path length, including detours; unaffordable movement is rejected
  rather than partially executed. Neighbor priority is north, west, east, south.
- Basic attacks are melee: explicit action ID, attack bonus, range in feet, and
  numeric damage dice. A reachable cardinal path within range is required; missing
  or blocked terrain and intervening actors block reach. Natural 1 misses, natural
  20 hits and doubles damage dice, flat damage is added once, and negative damage
  is clamped to zero. No spells, features, saves, defenses, equipment, or initiative
  are inferred. Their absence is a caller-visible milestone limitation.
- Each entity supplies an `attackIds` allowlist, `actionsRemaining`, and
  `movementRemainingFeet`. An attack consumes one action even when it misses.
  The caller grants budgets when opening its chosen turn/batch; the kernel never
  resets them or chooses multiplayer order.
- Commands are `{ commandId, actorId, type, payload }`. MOVE payload is
  `{ targetPosition: { x, y, z } }`; ATTACK is `{ targetId, actionId }`; PASS is `{}`.
  PASS records an outcome but leaves budgets and RNG unchanged. A defeated actor
  may pass; other actions and attacks against defeated targets are rejected.
- Terrain is `{ worldId, revision, walkableTiles: Position[] }`: final authoritative
  walkability after overlays, captured for this resolution. Missing cells block.
  The kernel neither knows chunk dimensions nor regenerates an alternate world.
  Defeated entities continue occupying their tile until a later supported lifecycle
  mechanism changes that state.
- `rules` contains `{ version: 'basic-v1', feetPerTile: 5, attacks }`. Persist the
  exact immutable rules catalog and terrain revision/data used, not only the
  algorithm version label. Command verification requires those same inputs.
- `rngState` is detached JSON-safe `AleaState` (`algorithm: 'alea-v1'` plus internal
  continuation fields). Use `new Alea(seed).snapshot()` once at session creation,
  then persist and restore the returned continuation; do not reseed every turn.

Context validation errors throw before execution. Malformed/unsupported commands
produce individual `rejected` outcomes with codes and consume no RNG, sequence,
or resources. Commands run in supplied order against the preceding result. A miss
is `resolved`, not `rejected`. Duplicate command IDs within one batch are rejected;
cross-request idempotency belongs to application persistence.

### Events and reconstruction

Each resolved command emits one event: `ENTITY_MOVED`, `ATTACK_RESOLVED`, or `PASSED`.
The event contains its schema/rules version, room/world identity, terrain revision,
command ID, actor ID, incrementing sequence, deterministic `roomId:sequence` ID,
and RNG before/after. Mechanical payloads record before/after state, budgets,
movement path, or attack definition, rolls and damage. HP zero represents defeat;
this milestone does not create loot, remove entities, or resolve death saves.

The same reducer applies events during live execution and history reconstruction.
It validates event schemas, sequence continuity, room/world identity, current
before-state, and recorded arithmetic. It restores RNG continuation and checks the
number of consumed RNG draws for attacks without resolving the attack again.
Corrupt versions, gaps, duplicate sequences, and contradictory before-state fail
closed. Events are trusted committed server outcomes, not client input; this is
not a cryptographic authenticity check. Verify the recorded dice values themselves
by command replay with the archived rules, terrain, and RNG.

Identical canonical initial state, ordered commands, complete versioned rules,
terrain snapshot, and RNG continuation yield identical next state, ordered events,
outcomes, and next RNG state. Splitting a batch at an event boundary and restoring
its JSON snapshot yields the same continuation. Per-call outcome `commandIndex`
starts at zero; it is not a global turn number.

### Application integration obligations

Authenticate membership and bind actor ownership before proposing commands. The
kernel validates mechanics, not users. Supply one room's canonical sheet state,
explicit budgets/action definitions and an authoritative terrain snapshot. Do not
pass raw Strapi sheets or silently coerce unsupported mechanics to basic attacks.

Persist resulting state, events, outcomes, exact commands, rules/terrain references,
event sequence, and RNG continuation in one transaction. Enforce cross-request
idempotency and revision checks there. Preserve rejected/uninterpretable input for
appropriate feedback. Narration receives committed events and outcomes afterward;
it cannot mutate state or rerun mechanics.

No application service has been rerouted by this engine-only change. The integrator
must route TurnPipeline and other approved entry points here and align persistence
schemas. Legacy event streams require explicit compatibility validation; they are
not automatically migrated or accepted by this reducer.

Focused verification:

```sh
./node_modules/.bin/vitest run src/api/game/src/engine/core/__tests__/command-kernel.test.ts src/api/game/src/engine/voxel/utils/__tests__/math.test.ts
```

## Existing components

`GameLoop` advances simulation time and runs registered systems. It is not used by
the command kernel. `DeterministicTurnProcessor` is the retained legacy move-only
processor; it does not provide this command/event contract. Other legacy engine
APIs remain available while the application integration is performed separately.
