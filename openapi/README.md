# DAICE OpenAPI Specification

This directory contains the OpenAPI 3.0 specification for the DAICE Backend API, automatically generated from the Postman collection.

## Files

- **`daicer-api.openapi.yaml`** - OpenAPI 3.0 specification in YAML format

## Regenerating the Spec

To regenerate the OpenAPI spec from the Postman collection:

```bash
node scripts/postman-to-openapi.js
```

This will:

1. Read the Postman collection from `postman/daicer-api.postman_collection.json`
2. Convert it to OpenAPI 3.0 format
3. Output the result to `openapi/daicer-api.openapi.yaml`

## Using with Cursor MCP

The OpenAPI spec is configured as an MCP server in Cursor's settings (`~/.cursor/mcp.json`).

This provides the AI assistant with:

- Complete API endpoint documentation
- Request/response schemas
- Authentication requirements
- Query parameters and path variables
- Example request bodies

## Servers

The spec defines three server environments:

- **Development** - `http://localhost:3001` (emulator-data)
- **E2E Testing** - `http://localhost:3101` (emulator-data-e2e)

## API Structure

### Health & Diagnostics

- `GET /health` - Liveness probe (no auth)

### Users

- `GET /api/users/me` - Get or create current user profile

### Rooms

- `POST /api/rooms` - Create room
- `GET /api/rooms` - List my rooms
- `POST /api/rooms/:code/join` - Join room by code
- `GET /api/rooms/:roomId` - Get room state
- `PATCH /api/rooms/:roomId/settings` - Update room settings
- `DELETE /api/rooms/:roomId` - Delete room
- `DELETE /api/rooms/:roomId/membership` - Leave room

### Game

- `POST /api/game/:roomId/world` - Generate world
- `POST /api/game/:roomId/character` - Add character
- `POST /api/game/:roomId/start` - Start adventure
- `POST /api/game/:roomId/turn` - Process turn

### Characters

- `GET /api/characters/:roomId` - List characters in room
- `GET /api/characters/:roomId/:playerId` - Get character
- `PUT /api/characters/:roomId/:playerId` - Update character
- `POST /api/characters/:roomId/:playerId/import` - Import character sheet

### Assets

- `POST /api/assets/avatar` - Generate avatar (all views)
- `POST /api/assets/avatar/preview/portrait` - Generate portrait preview
- `POST /api/assets/avatar/preview/upper` - Generate upper body preview
- `POST /api/assets/avatar/preview/full` - Generate full body preview
- `POST /api/assets/grid-background` - Generate grid background
- `POST /api/assets/action-frame` - Generate action frame

### Spells

- `GET /api/spells` - List all spells (with filtering)
- `GET /api/spells/:id` - Get spell by ID
- `GET /api/spells/search/query` - Search spells
- `GET /api/spells/shapes/:shape` - Get spells by shape
- `GET /api/spells/levels/:level` - Get spells by level

### Game Data (SRD)

- `GET /api/game-data/{resource}` - Get D&D 5e SRD data
  - alignments, abilities, skills, races, classes, backgrounds
  - languages, magic-schools, conditions, damage-types
  - equipment-categories, equipment, weapon-properties
  - character-templates, monsters, magic-items
  - features, traits, subclasses, proficiencies

### Tactical Combat

- `GET /api/tactical/arenas` - List arenas
- `POST /api/tactical/arenas/generate` - Generate arena from world
- `POST /api/tactical/encounter` - Create encounter
- `GET /api/tactical/encounter/:id` - Get encounter
- `POST /api/tactical/encounter/:id/units` - Add unit to encounter
- `PATCH /api/tactical/encounter/:id/units/:unitId` - Update unit position
- `DELETE /api/tactical/encounter/:id/units/:unitId` - Remove unit
- `POST /api/tactical/encounter/:id/start` - Start combat
- `POST /api/tactical/encounter/:encounterId/preview` - Preview action
- `POST /api/tactical/encounter/:encounterId/execute` - Execute action

## Authentication

Most endpoints require Firebase ID Token authentication via Bearer token in the `Authorization` header:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Exceptions:

- `GET /health` - No auth required

## Maintenance

**Important:** When you modify the Postman collection, remember to regenerate the OpenAPI spec:

1. Update `postman/daicer-api.postman_collection.json`
2. Run `node scripts/postman-to-openapi.js`
3. The OpenAPI MCP will automatically pick up the changes on next Cursor restart

## Related Files

- **Postman Collection**: `postman/daicer-api.postman_collection.json`
- **Postman Environments**: `postman/environments/`
- **Conversion Script**: `scripts/postman-to-openapi.js`
- **Cursor MCP Config**: `~/.cursor/mcp.json`
