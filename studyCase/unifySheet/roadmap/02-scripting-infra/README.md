# Phase 2: Scripting Infrastructure (The Migration Engine)

> **Objective**: establish a robust, reliable scripting environment using `@strapi/client`.

**CRITICAL RULE**: Do not use `strapi.createStrapi()`. It is slow, conflicts with the running dev server, and creates port binding errors. All scripts MUST use the REST API via our client wrapper.

## 2.1. The Client Factory

We need a standardized factory that authenticates and returns a ready-to-use client.

- [ ] Refactor `scripts/utils/strapi-client.ts`:
  - Ensure it reads form `.env` for `STRAPI_URL` and `STRAPI_ADMIN_TOKEN`.
  - Add `getPaginatedData<T>(collection: string)` helper to automatically handle the `page > pageCount` loop. This is essential for iterating 300+ monsters.
  - Implement `updateEntity<T>(collection: string, id: string, data: Partial<T>)` helper with error handling/retries.

## 2.2. The Migration Runner Pattern

Create a standard scaffolding for migration scripts so they are consistent.

```typescript
// Pattern for scripts/unify/01-dry-run.ts
import { createClient } from '../utils/strapi-client';

async function main() {
  const client = createClient();
  const monsters = await client.getAll('monsters', { populate: '*' });

  for (const m of monsters) {
    console.log(`Analyzing ${m.name}...`);
    // Validation logic
  }
}
main();
```

## 2.3. Safety Protocols

- [ ] **Dry Run Mode**: All scripts must accept a `--dry-run` flag to log changes without writing.
- [ ] **Snapshotting**: (Optional) A script to dump current JSON state of Monsters to a backup folder before huge batch updates.

## Deliverable

A set of reusable TypeScript helpers in `backend/scripts/utils` that make writing subsequent migration scripts trivial.
