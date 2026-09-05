# Playable backend/frontend milestone

Verified on 2026-09-05, America/Sao_Paulo, against the shared uncommitted backend
and frontend checkouts. This record covers the integrated player path; it does
not claim that every retained legacy feature is repaired or production-tested.

## Concrete goal

Two authenticated players create and join one room, select existing Entity
blueprints into distinct owned EntitySheets, ready, start, submit natural-language
MOVE/basic ATTACK or explicit PASS, and resolve one simultaneous round exactly
once. Both clients display authorized terrain, entities and messages and recover
accepted actions after reconnecting. Mechanical resolution uses one deterministic
kernel and archives the inputs and outcomes needed for replay.

The first milestone keeps roster and character changes in the lobby. Existing
members can reconnect anytime. The owner starts and resolves; every player must
submit or pass. Opening history is turn 0; the first actionable turn is 1.

## Current ownership

| Boundary | Current implementation |
| --- | --- |
| Player wire contract | `src/lifecycle/graphql/game-contract.ts` and `GAME_CONTRACT.md`; frontend `src/features/play/operations.graphql` generates against this SDL offline |
| Membership, lobby and receipts | `room-access.ts`, `room-lifecycle.ts`, and `game-operation` persistence |
| Player turn coordination | GraphQL → `turn-pipeline.ts` → `turn-lifecycle.ts`; legacy direct executors remain outside the public player contract |
| Intent interpretation | `intent-proposal.ts` requests a strict command proposal; authenticated membership supplies actor identity |
| Mechanics and replay | `src/api/game/src/engine/core/command-kernel.ts`; explicit state, commands, rules, terrain and RNG continuation |
| Persistence | Room canonical turn state, EntitySheets, Turn metadata, TimeFrames and Messages commit atomically with revision checks |
| World generation and overlays | `src/api/voxel-engine`; world/configuration-scoped chunks and persisted voxel changes |
| Viewer terrain | `room-terrain.ts`; one set of loaded chunks supplies both shadowcasting and allowlisted tile delivery |
| Active frontend | `PlayerRoomsPage`, `PlayerCharacterPage`, `PlayerRoomPage`, `PlayerTurn`, `PlayerMap` and one `useRoomView` poller |

Room/world/blueprint/sheet identifiers mean their respective Strapi document IDs.
A join code locates membership; it is not a room or world identifier. Gameplay
positions, HP and AC come from the captured canonical room state. Terrain and
entities use the same exact x/y/z visibility keys. Unknown cells are absent, and
the compatibility chunk endpoint returns null for cells outside that projection.
Map clicks fill editable movement text; only explicit submission sends an action.

## Feature and evidence matrix

| Feature | Verification | Result and limit |
| --- | --- | --- |
| Create → join → select → ready → start | Actual frontend forms in two isolated Chromium contexts, real Strapi HTTP and PostgreSQL | Passed, including distinct owned sheets and a newly generated world without manual spawn edits |
| Both players submit and owner resolves | Complete browser journey and independent HTTP checks | Passed; both clients advanced to the same next turn |
| Reconnect and duplicate prevention | Browser reload after an accepted pass; repeated HTTP request ID | Passed; accepted status survived reload and replay returned the original receipt |
| Natural-language MOVE and basic ATTACK | Actual proposal schema, actor binding, kernel and database; fixed provider output | Passed. Live model quality, credentials, latency and billing were not tested |
| Deterministic replay | Re-execute persisted commands against archived before-state, rules, terrain and RNG | Identical state and events; kernel-only determinism tests also exist |
| Failed mechanical commit | Inject failure at actual TimeFrame document creation | PostgreSQL rolled back state, revision, submissions and turn creation |
| Concurrent resolution | Competing HTTP requests with distinct request IDs | One turn committed; one request succeeded |
| Private data | Real authenticated member/nonmember/anonymous requests and two browser contexts | Nonmembers rejected; each member received their own private outcome; pending intent remained private |
| Terrain and entity visibility | Persisted wall fixture and actual room projection | Wall hid both the tile behind it and the other canonical actor; metadata was absent |
| World isolation | Two actual persisted worlds with equal seed/configuration and different overlays | Changes in one world did not appear in the other player's projection |
| Chunk dimensions and coordinates | Focused 16/32 geometry tests; real negative-coordinate chunk HTTP response | Correct sparse indexing and null masking |
| Snapshot/event relation | Actual schema metadata and create/populate round-trip | Missing owning relation repaired; new join table is additive; historical associations are not reconstructed |
| Actual frontend GraphQL documents | Validation against the composed Strapi schema | Passed, beyond standalone SDL/code-generation validation |
| Application bundle | Final Vite production build and browser runtime | Passed. Existing large-bundle warning remains |
| World configuration preview | Registered detached-preview tests and active creation screen | Preserved; preview is not substituted for persisted gameplay terrain |
| Google OAuth, production bootstrap, queues, GCS and deployments | Not exercised | Isolated tests used synthetic local accounts and omitted infrastructure startup side effects |
| Expanded mechanics and legacy authoring/debug executors | Retained source, outside this milestone's acceptance | Not certified playable; public direct execution remains closed pending intentional migration |
| Broad dead-code removal | Not performed | Prior reachability candidates still require small, evidence-backed cleanup batches |

The room contract bounds visible radius to 20 tiles and loads at most 32 chunks
per projection. Radius zero stays zero. The kernel terrain adapter has its own
bounded window; unusually small chunk configurations can exceed that limit and
fail closed. The covered dimensions are 16 and 32, not every configuration accepted
by the generic world editor. Public seeds/configuration and detached previews make
base terrain reproducible; visibility does not promise secrecy of that generator.

Basic-v1 covers ordered cardinal movement, explicit basic attacks and PASS.
Initiative, spells, saves, area effects, temporary HP, richer equipment mechanics,
disconnect deadlines, late admission and narration are not silently approximated.
Existing records remain available; incompatible histories fail with explicit errors.

## Repairs discovered during integration

The prepared turn service had no active TurnPipeline entry points. Those delegates
are installed. Real Strapi startup then exposed two failures that mocked tests had
missed: a JSON `active_effects` field was incorrectly included in population, and
`TimeFrame.events` referenced a missing owning `GameEvent.timeFrames` relation.
Both are repaired and covered by schema-aware tests plus actual persistence checks.

The frontend previously had entity markers without terrain. It now receives typed
viewer terrain through the existing poller. The legacy chunk endpoint uses the
same masked data, preventing a full-chunk visibility bypass. Three obsolete tests
calling removed APIs were reconciled with the registered current contract; their
mocked scope is now accurately named.

## Validation record

- 69 focused backend GraphQL/projection tests passed after reconciliation.
- 42 focused frontend player/map tests passed; the final map/draft adjustment
  passed a further six-test scoped rerun.
- Activation, adapter and reciprocal-relation checks passed separately.
- Backend TypeScript, frontend player-scoped TypeScript, changed-source lint and
  the final frontend production build passed. This was not a whole-suite run.
- 18 isolated HTTP/PostgreSQL acceptance checks passed.
- Two Chromium contexts completed the full frontend lobby-to-turn journey.
  Separate browser checks covered map drafts, reload recovery and a shared next
  turn. No browser page errors were observed.

The temporary runtime compiled the actual backend APIs, schemas, services and
GraphQL registration. It used PostgreSQL 15 and Strapi 5.32 with real local auth,
document operations and the actual compiled terrain worker. Application bootstrap
and queue/plugin side effects were omitted, and uploads used a local fixture
provider. Only the external structured-model response was replaced for MOVE and
ATTACK tests. A small authored spawn pad controlled the mechanical and visibility
fixtures; the separate full browser journey also started unmodified generated
terrain. This does not prove acceptable spawning for every seed.

Session evidence is retained under `/private/tmp/daicer-acceptance.PYPtsN/`:
`acceptance.cjs`, `results.json`, `browser.cjs`, `browser-results.json`,
`browser-lobby.cjs`, `browser-lobby-results.json`, and gameplay screenshots.
These are session artifacts, not permanent portable test infrastructure.

Stable focused commands, from the corresponding repository:

```sh
# Backend
./node_modules/.bin/vitest run src/lifecycle/graphql/__tests__ src/api/game/services/__tests__/room-access.test.ts src/api/game/services/__tests__/room-terrain.test.ts
./node_modules/.bin/vitest run src/api/game/services/__tests__/turn-pipeline.test.ts src/api/game/services/__tests__/turn-lifecycle.test.ts src/api/game/services/__tests__/turn-kernel-adapter.test.ts src/api/game-event/content-types/game-event/__tests__/schema.test.ts

# Frontend
./node_modules/.bin/graphql-codegen --config codegen.game.ts
./node_modules/.bin/vitest run src/features/play/__tests__ src/features/debug/components/__tests__/MapRenderer.test.tsx src/features/debug/components/__tests__/mapGeometry.test.ts
./node_modules/.bin/vite build
```

## Full backend validation after reconciliation

The full `yarn test:guard` run passed after repairing the stale test contracts:
3,002 tests passed and one existing test was skipped, across 223 passing test
files and one skipped file. Vitest reported 88.92% statements, 78.28% branches,
86.19% functions and 90.61% lines. Coverage thresholds and exclusions were not
lowered or broadened. Changed test files also passed ESLint.

Two obsolete EntitySheet test files were removed because they asserted retired
prewrite hydration or only checked that input existed. Their useful inventory
checks now live beside the canonical lifecycle tests, together with persisted
derivation checks. Both game-service onboarding aliases are checked against
`onboardPlayer`, preserving arguments and returned results.

The CLI suite now checks actual subprocess status, schema discovery and invalid
input without depending on a local database. Exploration's count/filter/shutdown
contract uses an explicitly mocked Strapi bootstrap boundary. This does not
certify actual standalone Strapi startup or real bootstrap failure formatting;
those remain environment integration checks.

The machine's linked development copy of `cocov` could not start. Validation used
the repository's pinned published `cocov@4.0.0` in a temporary environment and
restored the original dependency link afterward. Generated coverage baseline and
history updates were excluded from the source changes. The full run is recorded
in `/private/tmp/daicer-delivery.dpkvgc37/reconciliation-full-guard.log`.

## Next priorities

Run a controlled environment check for the chosen live LLM provider and OAuth
configuration, with the required authorization for paid operations. Then migrate
any needed legacy authoring/debug callers onto deliberate protected contracts.
Use the earlier reachability inventory for small cleanup batches after each
capability's replacement is demonstrated. This verification did not modify an
existing application database, deployment or paid service.
