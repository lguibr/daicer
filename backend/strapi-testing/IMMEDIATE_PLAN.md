# 🎯 Immediate Testing Scope (The "Alpha" Suite)

> **Objective**: Before writing complex logic tests, we must prove the **Test Infrastructure** works. Strapi 5 + TypeScript + Jest is notoriously difficult to configure due to the "Runtime compilation" requirement.

This plan details exactly **WHAT** I want to test immediately and **WHY**.

---

## 1. The "Harness" (Infrastructure Verification)

**What to test**: Can we boot Strapi in `test` mode, in-memory, compiling `.ts` files on the fly?
**Why**: Strapi natively expects `.js` in production. Our source is `.ts`. If the "Runtime Patcher" (in `tests/ts-runtime.js`) fails, **zero tests will run**.
**The Test**: `tests/app.test.js` -> `expect(strapi).toBeDefined()`.
**Success Criteria**:

- Boots in under 5 seconds.
- No "SyntaxError" on Typescript files.
- Connecting to `:memory:` implementation of SQLite (not a file).

## 2. The "Key" (Auth Salt Parity)

**What to test**: Can we register a user with `strapi.plugins['users-permissions']` and then Log In via the REST API?
**Why**: This validates the **Security Config**. A common bug is that the Test Environment uses a different `JWT_SECRET` or `API_TOKEN_SALT` than the runtime, causing valid tokens to be rejected.
**The Test**: `tests/auth.test.js`

- **Step 1**: Use Service API to create user `gimli`.
- **Step 2**: Use `supertest` to `POST /api/auth/local` with `gimli`'s password.
- **Step 3**: Assert we get a `200 OK` and a `jwt`.
  **Insight**: This proves the "Bridge" between the Internal Service Layer (creating the user) and the Public API Layer (logging in) is sound.

## 3. The "Tool Registry" (Agent Integrity)

**What to test**: Does every tool listed in `tool-registry.ts` actually point to a real function?
**Why**: The Agent is "Stringly Typed" (it outputs tool names as strings). If we rename `GameService.move` to `GameService.performMove` but forget to update the Registry, the Agent crashes at runtime.
**The Test**: `tests/tools.test.js`

- **Action**: Import `toolRegistry`. Iterate over `Object.values(tools)`.
- **Check**: `expect(tool.implementation).toBeInstanceOf(Function)`.
  **Insight**: This is a "Meta-Test". It catches drift between the Agent's definitions and the Codebase without needing to actually run the LLM.

---

## Summary of Files to Create

1.  `backend/tests/ts-compiler-options.js` (Config loader)
2.  `backend/tests/ts-runtime.js` (The TS Compiler Hook)
3.  `backend/tests/strapi.js` (The Main Harness)
4.  `backend/tests/app.test.js` (Smoke)
5.  `backend/tests/auth.test.js` (Auth)
6.  `backend/tests/tools.test.js` (Registry Check)

Once these pass, we have a "Green Build" and can proceed to porting the complex Review/Approvals logic.
