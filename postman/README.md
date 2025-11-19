# DAICE Postman Collection

This directory contains the Postman collection for testing and interacting with the DAICE backend REST API.

## Files

- `daicer-api.postman_collection.json` - Complete API collection with all endpoints
- `environments/` - Environment files for different deployment stages (git-ignored for security)

## OpenAPI Integration

The DAICE backend generates an **OpenAPI 3.0 specification** automatically from code annotations. You can use this in addition to or instead of the Postman collection.

### Import OpenAPI Spec into Postman

1. Open Postman
2. Click **Import** → **Link**
3. Enter: `http://localhost:3001/api-docs/spec` (or `http://localhost:3101/api-docs/spec` for E2E)
4. Postman creates a collection from the OpenAPI spec
5. Configure environment variables (same as below)

**When to use each:**

- **OpenAPI Import**: Quick start, auto-synced with code, good for basic testing
- **Hand-crafted Collection**: Complex workflows, pre-request scripts, test assertions, auto-variable population

Both are maintained and serve different use cases.

### Swagger UI

Interactive API documentation with "Try it out" feature:

- **Dev**: http://localhost:3001/api-docs
- **E2E**: http://localhost:3101/api-docs

No Postman required—test endpoints directly in your browser.

## Setup

### 1. Import the Collection

1. Open Postman
2. Click **Import** in the top-left
3. Select `daicer-api.postman_collection.json`
4. The collection will appear in your sidebar

### 2. Configure Variables

The collection uses the following variables:

| Variable            | Description                                    | Default                 |
| ------------------- | ---------------------------------------------- | ----------------------- |
| `BASE_URL`          | Backend API base URL                           | `http://localhost:3001` |
| `FIREBASE_ID_TOKEN` | Firebase authentication token                  | (empty)                 |
| `ROOM_ID`           | Current room ID (auto-populated)               | (empty)                 |
| `PLAYER_ID`         | Current player ID (auto-populated)             | (empty)                 |
| `ENCOUNTER_ID`      | Current tactical encounter ID (auto-populated) | (empty)                 |

### 3. Get Firebase Token

To authenticate requests, you need a Firebase ID token:

#### Option A: From the Frontend

1. Run the frontend locally: `yarn workspace @daicer/frontend dev`
2. Open browser DevTools → Console
3. Run: `firebase.auth().currentUser.getIdToken().then(console.log)`
4. Copy the token
5. In Postman, set `FIREBASE_ID_TOKEN` collection variable

#### Option B: From Firebase CLI

```bash
firebase auth:export users.json
# Use the token from the exported user data
```

### 4. Test the API

Start with the **Health Check** request (requires no auth):

```
GET {{BASE_URL}}/health
```

Then proceed with authenticated endpoints:

1. **Get Current User** - Verifies auth and creates/retrieves user profile
2. **Create Room** - Sets up a game room (auto-populates `ROOM_ID`)
3. **Update Room Settings** - Configure world settings
4. **Generate World** - Create narrative seed
5. **Add Character** - Submit a character (auto-populates `PLAYER_ID`)
6. **Start Adventure** - Generate personalized openings
7. **Process Turn** - Execute game turns

## Collection Structure

### 1. Health & Diagnostics

- Health check endpoint (no auth)

### 2. Users

- Get/create current user profile

### 3. Rooms

- Create, join, update, delete rooms
- List user's rooms
- Leave room membership

### 4. Game

- Generate world descriptions
- Add characters to room
- Start adventure with personalized openings
- Process game turns with DM responses

### 5. Characters

- List characters in room
- Get/update/import character sheets

### 6. Assets

- Generate avatars (portrait, upper-body, full-body)
- Generate grid backgrounds for tactical combat
- Generate action frame illustrations
- Sequential generation with preview endpoints

### 7. Spells

- List/filter spells
- Search spells
- Get spells by level, shape, class
- Get individual spell details

### 8. Game Data (SRD)

- All D&D 5e SRD reference data
- Races, classes, backgrounds, skills, abilities
- Equipment, weapons, armor
- Monsters, magic items
- Features, traits, subclasses, proficiencies
- Pre-made character templates

### 9. Tactical Combat

- Arena management
- Create/manage encounters
- Add/remove/update units
- Roll initiative and start combat
- Preview and execute actions with natural language commands

## Auto-Population

Some requests automatically populate variables based on responses:

- **Create Room** → sets `ROOM_ID`
- **Add Character** → sets `PLAYER_ID`
- **Create Encounter** → sets `ENCOUNTER_ID`

This allows you to chain requests without manual copy-paste.

## Testing Workflows

### Basic Game Flow

1. Create Room
2. Update Room Settings
3. Generate World
4. Add Character(s)
5. Start Adventure
6. Process Turn

### Character Creation Flow

1. Get Game Data (races, classes, backgrounds)
2. Generate Character from Template (optional)
3. Add Character to Room
4. Update Character (if needed)

### Asset Generation Flow

1. Generate Portrait Preview
2. Generate Upper Body Preview (using portrait)
3. Generate Full Body Preview (using both)
4. OR: Generate Avatar (all views at once)

### Tactical Combat Flow

1. List Arenas
2. Create Encounter
3. Add Units (players and enemies)
4. Start Combat (rolls initiative)
5. Preview Action (natural language)
6. Execute Action (with plan ID)

## MCP Integration

DAICE includes MCP (Model Context Protocol) server configurations for Cursor:

### Postman MCP

- **Location**: `.cursor/mcp.json`
- **Purpose**: Run API requests directly from Cursor AI prompts
- **Setup**: Get your Postman API key from https://go.postman.co/settings/me/api-keys

### Playwright MCP

- **Location**: `.cursor/mcp.json`
- **Purpose**: Drive browser automation and generate E2E tests
- **Allowed hosts**: localhost, localhost:3000, localhost:3001

### Project Rules

- `.cursor/rules/backend/37-postman-mcp.mdc` - When to use Postman MCP
- `.cursor/rules/testing/38-playwright-mcp.mdc` - When to use Playwright MCP

**Example prompts:**

```
Use postman-api. Run "Rooms / Create Room" in dev and show me the response.
```

```
Use playwright. Go to localhost:3000, login, create a room, and generate a test for it.
```

## Environment Files

Pre-configured environment files in `postman/environments/` for all stages:

### Development (Local - Port 3000/3001)

- **File**: `postman/environments/dev-local.postman_environment.json`
- **BASE_URL**: http://localhost:3001
- **FRONTEND_URL**: http://localhost:3000
- **Emulator Data**: Uses `emulator-data` (persistent dev state)
- **Emulator UI**: http://localhost:4000
- **Import**: Postman → Environments → Import

### E2E Testing (Local - Port 3100/3101)

- **File**: `postman/environments/e2e-local.postman_environment.json`
- **BASE_URL**: http://localhost:3101
- **FRONTEND_URL**: http://localhost:3100
- **Emulator Data**: Uses `emulator-data-e2e` (isolated test state)
- **Emulator UI**: http://localhost:4001
- **Import**: Postman → Environments → Import
- **Note**: E2E runs on different ports so you can develop and test in parallel!

### Production (Not Deployed Yet)

- **File**: `postman/environments/prod.postman_environment.json`
- **BASE_URL**: https://api.daicer.app (placeholder)
- **FRONTEND_URL**: https://daicer.app (placeholder)
- **Import**: Postman → Environments → Import
- **⚠️ WARNING**: Use with extreme caution when deployed!

**Port Summary**:

- **Dev**: Frontend 3000, Backend 3001, Emulator UI 4000, Firestore 8080, Auth 9099
- **E2E**: Frontend 3100, Backend 3101, Emulator UI 4001, Firestore 8081, Auth 9100
- **Prod**: TBD (Cloud Run + Vercel)

**Key Difference**:

- `dev` environment uses `emulator-data` for persistent development
- `e2e` environment uses `emulator-data-e2e` for isolated Playwright tests
- Different ports allow both to run simultaneously without conflicts!

**Security**:

- Local environment files are git-tracked (no secrets, all localhost)
- Production environment file is git-tracked but tokens must never be committed
- Use Postman Vault for any sensitive tokens (not synced to cloud)
- Set `FIREBASE_ID_TOKEN` as Secret type in Postman

## Auto-Refresh Auth

Use the JavaScript pre-request script for automatic token refresh:

**File**: `postman/scripts/firebase-auth-prerequest.js`

Add to Collection → Scripts → Pre-request in Postman. Requires environment variables:

- `FIREBASE_EMAIL` - Test user email for emulator
- `FIREBASE_PASSWORD` - Test user password
- `FIREBASE_API_KEY` - Firebase API key from console

Automatically refreshes expired Firebase tokens before each request.

## Response Format

All API responses follow this structure:

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      /* optional error details */
    }
  }
}
```

## Tips

1. **Authentication**: Most endpoints require the `Authorization: Bearer {{FIREBASE_ID_TOKEN}}` header
2. **Auto-Complete**: Use variables like `{{ROOM_ID}}` for dynamic values
3. **Test Scripts**: Some requests include test scripts that auto-populate variables
4. **Request Bodies**: Example request bodies are pre-filled with valid sample data
5. **Query Parameters**: Optional query parameters are disabled by default - enable in the UI

## CI/CD Integration

GitHub Actions workflow for running the collection in CI:

**File**: `.github/workflows/api-e2e-postman.yml`

Runs Newman (Postman CLI) with e2e environment (emulator-data-e2e) on every push/PR.

**Required GitHub Secrets**:

- `POSTMAN_API_KEY` - Your Postman API key
- `POSTMAN_COLLECTION_UID` - Collection UID from Postman
- `POSTMAN_E2E_ENV_UID` - E2E environment UID

**Note**: CI only runs e2e tests to avoid conflicts with concurrent emulator instances.

## Support

For API issues or questions:

- See `backend/src/api/README.md` for detailed endpoint documentation
- Check `backend/docs/graphs/` for LangGraph workflow diagrams
- Review `.cursor/rules/backend/37-postman-mcp.mdc` for MCP usage
- Review `.cursor/rules/testing/38-playwright-mcp.mdc` for browser testing

## Version

Collection Version: 1.0.0
Backend API Version: Compatible with DAICE backend v1.x
