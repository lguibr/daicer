# @daicer/shared

## Purpose

The **Shared** package serves as the "Universal Dictionary" for the Daicer monorepo. It contains contracts, types, and schemas that must be identical across the Frontend, Backend, and Engine.

**Rule**: Anything here must be dependency-free (except for `zod`).

## Architecture

This package exports **Data Transfer Objects (DTOs)** and **Validation Schemas**.

- **Source of Truth**: It defines the "shape" of data over the wire (Sockets, API).
- **Zod-First**: We define schemas in Zod and infer Typescript types from them, not the other way around.

## Key Modules

### 1. `schemas/`

The primary export. Contains validation logic for:

- **Socket Events**: Payloads for `game:action`, `narrator:stream`, etc.
- **Shared Domain Entities**: Simple types used everywhere (e.g., `Point`, `Vector`).

## Usage

```typescript
import { SocketEventSchemas } from '@daicer/shared';

// Backend Validation
const payload = SocketEventSchemas.gameAction.parse(rawData);

// Frontend Type Safety
type GameActionPayload = z.infer<typeof SocketEventSchemas.gameAction>;
```

## Dependencies

- **Upstream**: None.
- **Downstream**:
  - `@daicer/backend` (Imports schemas to validate incoming requests).
  - `@daicer/frontend` (Imports types to ensure type-safe emits).
  - `@daicer/engine` (May import basic shared scalars like `Point`).
