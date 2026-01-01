# 🛡️ Backend Testing Rules (The Triad Shield)

> **Philosophy**: The Backend is the _Bridge_. It connects the deterministic Engine, the creative Agent, and the persistent Database. Tests here verify _connectivity_ and _security_, not the physics (Engine) or the creativity (LLM).

## 1. The Golden Rule of Speed: In-Memory Only

**Rule**: Backend tests MUST run in under 30 seconds for the entire suite.
**Why**: Slow tests are deleted tests.
**Implementation**:

- Use `better-sqlite3` or `sqlite3` with `filename: ":memory:"` in the test config.
- NEVER connect to a real file-based SQLite or a live Postgres during `yarn test`.
- Aggressively clean up the DB between tests (`afterEach`).

## 2. The "Mock the Brain" Mandate

**Rule**: NEVER call an external LLM API during testing.
**Why**: It's slow, expensive, and non-deterministic.
**Implementation**:

- Mock all LangChain/GoogleGenAI calls.
- **Verification**: Check that the _prompt_ matches what you expect, and that the _parser_ handles the mock response correctly.
- **Fail Check**: Simulate 500s and API timeouts from the LLM to ensure the backend doesn't crash.

## 3. The Salt Parity Protocol

**Rule**: Test Logic == Production Logic.
**Why**: Auth bugs often stem from slight config differences (e.g., JWT secrets).
**Implementation**:

- Ensure `strapi` harness in tests uses the _exact_ same hashing/salt algorithms as production.
- If you change a security config, you MUST update the test harness first.

## 4. Permission Boundary Verification

**Rule**: Verify "Access Denied" as rigorously as "Access Granted".
**Why**: Leaking a character sheet is worse than a crashed server.
**Implementation**:

- Every Content Type test suite must have a "Hostile User" case.
- Create a user, ensure they can see their own data.
- Ensure they get `403 Forbidden` for another user's data.

## 5. The "Shell" Test (Lifecycle Integrity)

**Rule**: Test the side effects, not just the CRUD.
**Why**: Strapi logic lives in Lifecycles (e.g., Embeddings on save).
**Implementation**:

- When testing `create`, assert that:
  1. The record is in the DB.
  2. The _Lifecycle Hook_ ran (spy on it or check the side effect, like vector generation).
- If a Lifecycle depends on an external service (like Pinecone), MOCK the service but verify the _hook_ fired the mock.

## 6. Socket/REST Mirroring

**Rule**: If it happens on REST, it echoes on Socket.
**Why**: The Frontend relies on realtime updates.
**Implementation**:

- Spy on the `socket.emit` method.
- When you `POST /perform-action` via Supertest, assert that `game:event` was emitted with the correct payload.

## 7. The Voxel Chunk Contract

**Rule**: Verify the shape, not the noise.
**Why**: Procedural generation is the Engine's job. The backend just serves it.
**Implementation**:

- Backend tests verify that `/api/map/chunk` returns a valid JSON that conforms to the `Chunk` schema.
- Do NOT test "Is there a tree at 10,10?" (Engine concern).
- DO test "Does this crash if I ask for chunk 999999,999999?"

## 8. Test Data Factories

**Rule**: No Magic Strings or "Inline Objects" in tests.
**Why**: Tests become brittle when schemas change.
**Implementation**:

- Use central Factory functions: `createMockCharacter()`, `createMockUser()`.
- If the schema changes (e.g., adding `wisdom` stat), you only update the Factory, not 50 broken tests.

## 9. Admin Exclusion

**Rule**: Tests run potentially in "Development" mode of Strapi artifacts, but should behave like Production.
**Implementation**:
Ensure no "Content Type Builder" routes are exposed during tests unless specifically testing plugin logic. Default role should be "Public" or "Authenticated", never "Super Admin" unless testing admin features.
