# World terrain service

The backend builds a configured-size seven-layer chunk through WorldAtlas,
seeded terrain, flora, and civilization. Final block flags use one TileHelper
policy. Persisted world changes overlay the generated base before it is cached.
Canvas can continue using block colors and entity markers; PixelForge is independent.

## Application interface

```ts
import { normalizeWorldConfig } from '@/api/world/utils/world-config';

const config = normalizeWorldConfig(room.world);
const worldId = room.world.documentId;
const terrain = strapi.service('api::voxel-engine.voxel-engine');
const chunk = await terrain.getChunk(chunkX, chunkY, config, worldId);
const tile = await terrain.getTileAt(worldX, worldY, z, config, worldId);
await terrain.editVoxel({
  worldId,
  config,
  chunkX,
  chunkY,
  voxelX,
  voxelY,
  voxelZ,
  newType: 'wall_stone',
  reason: 'terrain edit',
  metadata: { marker: true },
});

// Editor preview: pure generation; never reads persisted changes.
const preview = await terrain.getPreviewChunk(chunkX, chunkY, config);
```

The application must authenticate membership, resolve Room.documentId to an
existing World.documentId, and pass authoritative persisted world configuration.
Room join codes and numeric database ids are not world ids. Neither missing world
identity nor an old positional edit call falls back to an unscoped database read.
A structurally valid identifier alone does not establish membership or existence.

`normalizeWorldConfig` selects the existing WorldConfig fields, fills missing
values with World schema defaults, preserves explicit zero values and does not
mutate the source document. New worlds default to 32 cells; existing 16-cell worlds
remain 16. Dimensions must be positive integers up to 64; detail is bounded to 16.
Detail below one requests zero elevation octaves, producing finite elevation zero
before the existing atlas overrides; it never divides by zero in the noise sampler.
Do not change a persisted world's chunk size to reinterpret existing edits. No
legacy data migration is included. Generation-affecting changes invalidate cache
identity; existing overlays retain their stored world/chunk/local coordinates.

`WorldGenerator(config, worldId)` provides a bound adapter for `PhysicsEngine`.
Its `chunkSize` is authoritative. `PhysicsEngine.calculateFieldOfView` returns
`x,y,z` keys; application visibility projection remains outside this service.

## Chunk and coordinate contract

Persisted reads return `WorldChunk` from `services/chunk-manager.ts`:

```ts
{
  worldId, configHash, generatorVersion, revision,
  x, y, size, minZ: -3, maxZ: 3, seed,
  tiles // [z - minZ][localY][localX]; each tile has global x/y/z
}
```

`revision` is an opaque SHA-256 content identity, not a numeric turn counter.
Combine ordered chunk identities when constructing a multi-chunk engine snapshot.
The application owns the monotonic room revision in the wire protocol.

For dimension N, `chunkX = floor(worldX / N)` and
`localX = worldX - chunkX * N`, likewise for y. This handles negative coordinates.
Local coordinates range from zero through N-1. World and local coordinates must be
safe integers; z ranges from -3 through 3. Pixel size is independent of N.

Client DTOs must preserve chunk/world/config identity, dimensions and z bounds.
The application filters cells, entities and metadata before delivery. Unknown
cells are absent/null; visibility keys include z. Empty visible sets never mean
unrestricted gameplay visibility. Authentication, visibility radius/policy and
transport fields belong to the application contract, not this internal API.

## Determinism, caches and persistence

- Terrain randomness is addressed by seed, global coordinates and purpose; builder
  reuse and request order do not advance a shared random stream. Generator identity
  is `world-terrain-v2`, reflecting corrected bedrock/variant and final block flags.
- A 200-entry LRU cache includes world, normalized full configuration, generator
  version and chunk coordinates. Only completed overlays enter this cache.
- Reads and edits serialize per world/chunk, including configuration variants.
  Concurrent misses share the generated result through that queue. Callers receive
  independent snapshots, so mutation or visibility filtering cannot poison cache.
- Replay queries always filter world and chunk. Pages sort by numeric bigint
  timestamp and database id; all pages are replayed. Invalid stored edits fail the
  read rather than silently disappearing. No database writes happen during reads.
- Metadata-only edits resolve the existing block. Successful writes invalidate all
  configuration variants of the affected world's chunk. Failed reads/writes reject;
  failed persistence never changes cached terrain. No base-terrain fallback masks
  persistence failure. Worker errors/exits release pending operations.

The queue and cache are process-local. These tests do not establish multi-process
write coordination, cross-process invalidation, database transaction isolation or
live Strapi behavior. All writes to a world chunk must pass through the same manager
for these serialization guarantees. Direct database edits require cache reset/restart.
The edit method is a standalone persistence boundary; callers wrapping it in a larger
transaction must coordinate invalidation with transaction commit before exposing reads.

## Caller migration ownership

The service intentionally removes implicit gameplay fallbacks. Application owners
must migrate `game.ts`, `turn-processing.ts`, `action-engine.ts`,
`terrain-feature-service.ts`, and GraphQL chunk/preview resolvers to the signatures
above. Collision must use final tiles, not a separate base TerrainGenerator.
The voxel preview controller and map-explorer preview/controller calls also need
explicit pure-preview selection or an authorized world context and object edits.
These controllers and application call sites are outside this repair batch.

The frontend owner must consume the lifecycle owner's wire DTO, request world-scoped
chunks, honor dynamic dimensions and server visibility, discard old-world responses,
and send numeric `{x,y,z}` clicks. No frontend or PixelForge changes are included here.

## Focused offline verification

```sh
./node_modules/.bin/vitest run src/api/voxel-engine/services/__tests__/chunk-manager.test.ts src/api/voxel-engine/services/__tests__/chunk-persistence.test.ts src/api/voxel-engine/services/__tests__/world-determinism.test.ts src/api/voxel-engine/services/__tests__/voxel-engine-service.test.ts src/api/voxel-engine/services/utils/__tests__/physics.test.ts src/api/world/utils/__tests__/world-config.test.ts src/api/world/content-types/world/__tests__/lifecycles.test.ts
```

The manager tests use mocked worker transport and an in-memory document repository.
They exercise two worlds with identical seeds across cold/warm/concurrent reads and
LRU eviction/reload, configuration variants, incomplete overlays, metadata-only edits,
write/read failures, worker failure recovery, replay pagination/order, and 16/32
negative-coordinate boundaries. Separate tests use real builders/noise/flora and
persisted overlays without starting Strapi, a database, or any generation API.
