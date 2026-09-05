# Player game contract v1

`game-contract.ts` is the authoritative SDL for the player lifecycle. Its
`standaloneGameSchema` export supports offline operation validation and focused
frontend code generation. `gameContractExtension` uses the identical definitions
for Strapi integration. The declarative contract does not itself install resolvers
or establish runtime authorization; the application integration batch does that.

## Identity and projection

- `roomId` means Room `documentId`, never the legacy roomId column or database PK.
- `code` is only a join identifier. Preserve existing codes, including UUID codes.
- `worldId` means World `documentId`; `blueprintId` means Entity `documentId`.
- `characterSheetId` means EntitySheet `documentId`. Only sheet IDs identify actors.
- Authentication supplies user identity. No mutation accepts owner, user, or actor IDs.
- `RoomView` is an allowlisted viewer DTO, not a raw Room entity. `myself` is the
  viewer's selected sheet. Other players expose submission status, never pending text.
- Messages are room-public or addressed to this viewer. The owner has no private
  message override. History pagination uses the same audience predicate.
- Missing membership rejects access. Missing viewer position or visibility failure
  must never expose every entity. Generic and nested reads need equivalent guards.
- World configuration is authoritative and preserves explicit zero values and
  configured chunk sizes. Coordinates are numeric; z is an integer world layer.

## Operations

All mutations use a request ID scoped by authenticated user and operation. Same
request ID and input returns the same result/resource; different input conflicts.
Semantic validation (nonempty IDs/text, valid config and turn number) remains a
runtime requirement beyond GraphQL type validation.

```graphql
mutation Create {
  createRoom(input: {
    requestId: "create-1", language: "en",
    worldConfig: {seed: "harbor", chunkSize: 16, seaLevel: 0}
  }) { roomId code phase players { userId ready characterSheetId } }
}
mutation Join {
  joinRoom(input: {requestId: "join-1", code: "existing-code"}) { roomId }
}
mutation Select {
  selectCharacter(input: {
    requestId: "select-1", roomId: "room-a", blueprintId: "blueprint-a"
  }) { players { userId characterSheetId characterName ready } }
}
mutation Ready {
  setReady(input: {requestId: "ready-1", roomId: "room-a", ready: true}) {
    players { userId ready } capabilities { canStart }
  }
}
mutation Start {
  startGame(input: {requestId: "start-1", roomId: "room-a"}) {
    operationId roomId phase turnNumber status
  }
}
mutation Submit {
  submitAction(input: {
    requestId: "submit-1", roomId: "room-a", turnNumber: 1,
    kind: intent, text: "I move one tile east."
  }) { submissionId turnNumber status submittedCount requiredCount }
}
mutation Resolve {
  resolveTurn(input: {requestId: "resolve-1", roomId: "room-a", turnNumber: 1}) {
    operationId roomId phase turnNumber status
  }
}
```

An explicit pass uses `kind: pass` and omits text. Submission acknowledges durable
intent, not mechanical success. Uninterpretable intent becomes `needs_revision`
with private feedback; it must not disappear. Turn 0 is the opening; first player
turn is 1. `ready` is lobby approval and is not changed by turn submission.

```json
{"data":{"submitAction":{"submissionId":"submission-a1","turnNumber":1,"status":"submitted","submittedCount":1,"requiredCount":2}}}
```

Read `gameView` after mutation or reconnect. Its `turn` and `mySubmission` are null
before gameplay. A newer revision replaces older projected state. Use
`gameMessages(roomId, before, last)` for older messages; each page returns ascending
message order, an opaque start cursor, and `hasPreviousPage`.

Errors use GraphQL `errors[].extensions.code`: `UNAUTHENTICATED`, `FORBIDDEN`,
`ROOM_UNAVAILABLE`, `INVALID_PHASE`, `CHARACTER_REQUIRED`, `NOT_ALL_READY`,
`NOT_ALL_SUBMITTED`, `STALE_TURN`, `TURN_RESOLVING`, `INVALID_INPUT`,
`IDEMPOTENCY_CONFLICT`, `LEGACY_STATE_UNSUPPORTED`. Do not reveal private state in
error details. The SDL carries legacy lowercase phases for read compatibility;
it does not migrate records or authorize continuation of incompatible history.

## Runtime policy and integration

The milestone uses simultaneous submissions and owner-triggered resolution. New
players and character changes are accepted only in the lobby; existing members
can reconnect anytime. Submitted actions are fixed for that round; invalid or
expired proposals can be revised. There are no disconnect deadlines. Runtime
capabilities govern client actions.

The application binds LLM proposals to the member's selected sheet, validates room
scope and command schema, and invokes a pure explicitly ordered kernel. The kernel
accepts canonical state, versioned rules, authoritative terrain, and serialized RNG;
it returns next state, ordered events, outcomes, and next RNG. It never persists.
The application resolves room-to-world identity before terrain reads. Mechanical
commit, turn numbering and consumed submissions are atomic. Narration describes
committed outcomes and cannot rerun mechanics after failure.

Runtime registration now consumes this SDL. RoomView, myRooms, characterBlueprints, gameMessages and lobby mutations use the protected services. startGame, submitAction and resolveTurn enter TurnPipeline and delegate to the durable turn-lifecycle service, with no legacy fallback. World chunk requests use canonical room document IDs, membership checks, stored chunk size, and the world's document ID. The compatibility chunk response contains only cells already present in the viewer terrain projection; unknown cells are null. Preview uses detached generation. Raw model CRUD, reverse state relations and legacy direct execution are not part of this public contract.

Active turn semantics: completed initialization is turn 0; players submit against collecting turn 1. startGame and resolveTurn return a completed operation after atomic persistence; intermediate running receipts stay internal. resolveTurn requires the owner and all submissions. New turns increment by one. Existing members reconnect through gameView. Pending text/feedback is viewer-private. A rejected proposal remains needs_revision; a mechanically blocked command at resolution gets a private outcome and the round advances. Execution ordering is lexicographic characterSheetId, with one action and race-derived movement per round.

Proposal status includes proposing while private intent is durably saved and the model is running. Unusable responses become needs_revision. After 120 seconds, reconnect projects expired proposals as needs_revision without rewriting stored state; a fresh request ID replaces the old token. Late responses are rejected if that token was replaced. Public player status only reports fully submitted actions.

Clients must refresh viewer projections even when room revision is unchanged: the proposal-expiry clock can change proposing to recoverable needs_revision without a database write. The revision guards persistent state changes, not clock-derived presentation.

## Viewer terrain

`RoomView.terrain` is null outside gameplay or when authoritative terrain is
unavailable. Otherwise it contains `worldId`, content `revision`, `chunkSize`,
`minZ: -3`, `maxZ: 3`, and a flat list of visible `tiles`. Each tile has integer
`x/y/z`, `block`, `biome`, `isWalkable` and `isTransparent`; custom persisted
metadata is never exposed. The room world's normalized fog radius is floored
and bounded to 20 tiles, preserving zero. At most 32 chunks are loaded per
projection; unsupported windows fail closed.

The existing shadowcasting implementation filters the viewer's current layer.
Entities use exactly the same visible tile keys. Active positions, HP and AC
come from the captured canonical room state, rather than mixing newer sheet
writes into an older room revision. Per-request chunk snapshots are shared
between visibility and tile delivery. Terrain failure suppresses other entities
and disables submission/resolution capabilities until a successful refresh.

The frontend consumes this field through its single room poller, draws sparse
Canvas placeholders, and can fill a movement intent from a visible walkable
tile. Mechanical action still requires explicit text submission and server
validation. Public seed/configuration and detached previews make base terrain
reproducible; this boundary protects persisted overlays, metadata and entity
projections, not secrecy of the generator itself.
