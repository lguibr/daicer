# Daicer Backend Testing Strategy & Study

> **Purpose**: This document outlines the strategic approach for implementing a robust testing layer for the `@daicer/backend` (Strapi 5). It analyzes integration with the `@daicer/engine` (Deterministic Core) and the LLM Agent layer, proposing a comprehensive suite of insights and specific test cases.

## Core Architecture & Philosophy

The Daicer backend is unique because it serves as a bridge between a **Stateful CMS (Strapi)**, a **Deterministic Game Engine (`@daicer/engine`)**, and a **Probabilistic Agent (LLM)**.

Testing must respect this triad:

1.  **Strapi**: Tests API contracts, RBAC, and Persistence.
2.  **Engine**: Tests are _already_ in the engine package. Backend tests only verify the _bridge_.
3.  **LLM**: Tests must be mocked. We test the _integration flow_, not the model's intelligence.

---

## 20 Strategic Insights (Insides)

1.  **In-Memory Speed**: We use `better-sqlite3` or `sqlite3` in `:memory:` mode. This ensures tests run in milliseconds, not seconds, allowing for TDD loops.
2.  **The "Harness" Pattern**: We must patch Strapi's configuration loader to support TypeScript (`.ts` files) natively during tests, as Strapi's default test runner often expects compiled JS.
3.  **Engine Determinism simplifies Backend Tests**: valid game logic is guaranteed by `@daicer/engine` unit tests. Backend tests only need to prove that `ActionDispatcher` is called with the correct arguments, not that the rules are checking out (e.g. "Did the attack hit?").
4.  **LLM Cost Avoidance**: Usage of `LangChain` mocks is mandatory. We verify that the prompt is constructed correctly and that the _parsed_ output is handled, but we never call OpenAI/Google during `yarn test`.
5.  **Socket/REST Parity**: The backend broadcasts updates via Socket.IO. Integration tests should spy on the socket emitter to ensure that an HTTP action triggers the correct realtime event.
6.  **Role-Based Access Control (RBAC)**: Strapi's permissions are complex. We must test that a standard "Player" cannot access "Admin" routes or Modify another player's "Character Sheet".
7.  **Service Isolation**: We can mock the entire `strapi.plugin('users-permissions')` layer for unit tests to avoid database hits when testing pure business logic.
8.  **The "Factory" Pattern for Entities**: Helpers like `createTestCharacter()` or `createTestRoom()` should wrap Strapi's `create` methods to provide type-safe, default-populated seeds for every test.
9.  **Lifecycle Hook integrity**: Much of Daicer's logic lives in `lifecycles.ts` (e.g., generating embeddings on save). Tests must trigger these hooks to verify side effects.
10. **Vector Store Mocking**: We shouldn't actually write to Pinecone/PGVector during tests. The `EmbeddingService` should be mocked to return a fixed vector array.
11. **RAG Context Verification**: A crucial test is verifying that the _Knowledge Source_ fragments are correctly retrieved and injected into the LLM context window.
12. **Voxel Engine Integration**: The backend serves chunks. Tests should verify that a request for chunk `0,0,0` returns a valid JSON that matches the Engine's schema, without testing the procedural generation logic itself.
13. **Error Handling & 500s**: The Agent handles errors via the `try/catch` in tools. Tests must force errors (e.g., "DB Down") to ensure the Agent receives a clean "I failed to do that" message rather than crashing.
14. **Authentication Salt Parity**: Ensure the test environment uses the exact same JWT verification logic as the live environment to prevent "It works in test, breaks in prod" auth issues.
15. **Type Safety in Tests**: Tests must be written in TypeScript (`.ts`). `any` is forbidden in tests just as it is in source code.
16. **Seeding Strategy**: Use a specific `seed.ts` for the test environment that populates the "Rules" and "Prompts" singletons, so tests have a baseline of "Game Truth".
17. **Tool Registry Verification**: We should iterate over `tool-registry.ts` in a test to verify that every tool mapped there actually corresponds to an executable service method.
18. **Statelessness**: Every test file must assume a clean slate. `beforeEach` and `afterEach` hooks must aggressively clean up the in-memory DB.
19. **Log Suppression**: Tests should mock `strapi.log` to keep the console output clean, only showing test results.
20. **CI/CD Integration**: The harness must support the `CI=true` flag to disable any interactive debug modes and fail fast.

---

## 20 Critical Test Cases (Testes)

### Unit (Logic & Bridges)

1.  **`ActionDispatcher` Bridge**: Mock the Engine. Call `backend.performAction('MOVE')`. Assert Engine received correct `{ type: 'MOVE' }` payload.
2.  **`CharacterSheet` Formatting**: Pass a raw Database Entity. Assert the returned JSON matches The `CharacterSheet` shared interface exact structure.
3.  **`KnowledgeSnippet` Chunking**: Pass a large Markdown string. Assert it splits into expected `N` chunks based on headers.
4.  **`DiceParser` wrapper**: Pass "2d20+5". Assert backend validation accepts it. Pass "2d20+SQL_INJECTION". Assert backend throws Validation Error.
5.  **`PromptManager` Template Injection**: Pass variables `{name: 'Gimli'}` to the stored prompt template. Assert output string contains "Gimli".

### Integration (API & State)

6.  **Smoke Test `/api/hello`**: Simple GET request returns 200 OK. Confirms Server is up.
7.  **Authentication Success**: POST `/api/auth/local` with valid creds. Returns JWT + User object.
8.  **Authentication Failure**: POST `/api/auth/local` with wrong password. Returns 400 Bad Request.
9.  **Authorized Content Access**: User A requests `/content-manager/collection-types/.../characters`. Returns only User A's characters.
10. **Unauthorized Content Access attempt**: User A tries to GET User B's character by ID. Returns 403 Forbidden.
11. **Create Character Flow**: POST to create character. Verify DB entry exists AND `lifecycle.afterCreate` triggered (e.g. init stats).
12. **Game Room Join**: Simulate Socket `join_room` event. Verify socket is added to correct IO room.

### System & Agent (Mocked LLM)

13. **Narrator Loop - Happy Path**: Send "I attack the goblin". Mock LLM response "Tool Call: Attack". Verify `ActionDispatcher` was called.
14. **Narrator Loop - Unknown Tool**: Mock LLM response "Tool Call: Dance". Verify Agent handles "Tool not found" error gracefully.
15. **RAG Retrieval**: Trigger a question "Who is the King?". Mock Vector Store to return "King Arthur". Verify "King Arthur" is present in the final prompt sent to LLM.
16. **Image Generation Trigger**: User says "Show me the castle". Verify `generate_image` tool is selected by the Planner.
17. **Map Chunk Fetch**: GET `/api/map/chunk?x=0&y=0`. Verify response is valid compressed Voxel data.
18. **Admin Config Protection**: Anonymous GET `/api/strapi/config`. Returns 403 or 404.
19. **Asset Upload**: Simulate file upload to Media Library. Verify `upload` provider is invoked.
20. **Full Combat Turn**:
    - **Step A**: Player sends "Attack".
    - **Step B**: Agent calls `perform_action`.
    - **Step C**: Engine resolves (Hit -> Damage).
    - **Step D**: Backend persists new HP.
    - **Step E**: Socket emits `update_entity`.
    - **Verify**: Client receives the socket event with new HP.

---

## Implementation Roadmap

1.  **Dependencies**: `yarn add -D jest supertest ts-jest @types/jest`
2.  **Harness**: Create `tests/strapi.js` to boot Strapi in `test` mode.
3.  **Config**: `jest.config.js` to map paths (`@/` -> `src/`).
4.  **First Test**: Implement `tests/app.test.js` (Smoke Test).
