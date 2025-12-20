# Gameplay Debugging Summary

## Discoveries

### 1. ID Consistency (Strapi 5)

- **Issue**: The frontend (`GameplayScreen.tsx`) was inconsistent in using `room.id` (integer) vs `room.documentId` (string). Strapi 5 relies on `documentId` for most public API interactions.
- **Fix**: Updated `GameplayScreen.tsx` to prioritize `room.documentId` in `handleSubmitAction` and child component props.
- **Outcome**: `submitAction` calls now correctly identify the room.

### 2. Permission Model (403 Forbidden)

- **Issue**: The `submitAction` endpoint (and other game controller actions) returns `403 Forbidden` for the Authenticated role because these are custom controller actions, not standard Content Type routes.
- **Discovery**: The "mock" JWT used in E2E tests is actually a valid token for User ID 2, confirming that Auth is active.
- **Fix**: Updated `backend/src/index.ts` bootstrap function to programmatically grant permissions for `api::game.game.*` actions (including `submitAction`, `processTurn`) to the Authenticated role.

### 3. Backend Persistence & State

- **Issue**: The `processTurn` service was calculating the LLM response but **not saving it** to the database or emitting socket events. This caused the frontend to hang waiting for a response that never came.
- **Fix**: Refactored `backend/src/api/game/services/game.ts`:
  - Added `roomId` parameter.
  - Implemented `strapi.documents(...).update` to append the DM response to `history` and clear player `action`/`isReady` flags.
  - Implemented `streamManager.broadcast` to emit `message:new` and `game:update` events.

### 4. Type Safety & Syntax

- **Issue**: `Message` interface mismatch (missing `type` field) and a copy-paste syntax error in `GameController` (duplicate `.processTurn`).
- **Fix**: Corrected `backend/src/types/index.ts` and `backend/src/api/game/controllers/game.ts`.

## Current Status & Problems

### 1. Backend Instability (Resolved?)

- **Problem**: The backend became unreachable (`ERR_CONNECTION_REFUSED`) during recent E2E runs (10-12). This was likely due to:
  - Rapid restarts during code edits.
  - Syntax errors (now fixed).
- **Status**: A manual restart (`yarn develop`) was initiated. Pending confirmation of stability.

### 2. E2E Verification Incomplete

- **Problem**: Due to connection errors, the E2E test has not yet completed a full pass since the `processTurn` refactor.
- **Progress**:
  - `submitAction` is confirmed working (Run 9).
  - Map rendering and Game Start are mostly stable.
  - **Missing Confirmation**: We need to verify that "DM Response" appears in the chat and the turn cycle resets correctly.

## Next Steps

1.  **Verify Backend**: Ensure the backend is running without errors on port 1337.
2.  **Run E2E**: Execute `npx playwright test frontend/e2e/game-flow.spec.ts` one more time.
3.  **Cleanup**: Remove the verbose debug logs from `api.ts` and `GameplayScreen.tsx` once the test passes.
