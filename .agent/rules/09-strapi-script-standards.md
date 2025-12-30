# 📜 Scripting Standards (The Law)

> [!CAUTION] > **READ THIS BEFORE WRITING A SCRIPT**
> Violating these rules will cause port conflicts, memory leaks, and "Address already in use" errors.

## 1. The Golden Rule: "One Instance to Rule Them All"

**You must NEVER instantiate a new Strapi instance inside a script if you intend to interact with a running development server.**

### ❌ Forbidden Pattern (The "Factory" Anti-Pattern)

Do **NOT** do this in standalone scripts:

```typescript
// ⛔️ BAD: Tries to boot a second server on port 1337
import Strapi from '@strapi/strapi';
const app = await Strapi().load();
```

### ✅ Mandatory Pattern (The "Client" Pattern)

**ALWAYS** use the `@strapi/client` to talk to the existing server running on `localhost:1337`.

```typescript
// ✅ GOOD: Connects to the already running brain
import { strapi } from '@strapi/client';

const client = strapi({
  baseURL: 'http://127.0.0.1:1337/api',
  auth: process.env.STRAPI_AUDIT_TOKEN, // Use a long-lived token
});

// Use it like an SDK
await client.collection('monsters').find({ ... });
```

## 2. Why?

1.  **Port Conflicts**: `yarn develop` is already listening on port 1337. A second instance will crash.
2.  **Memory Usage**: Strapi is heavy. Loading it twice kills the dev machine.
3.  **State Safety**: The running server owns the database connection pool and socket streams. External scripts should be "Guests", not "Hosts".

## 3. Exceptions

The only time you may use `createStrapi()` is for **CI/CD Build Steps** or **Unit Tests** that run in an isolated environment where NO server is running (e.g., purely to generate types or check schema validity).

## 4. How to Auth?

Create a **Full Access API Token** in the Strapi Admin Panel and put it in your `.env`:

```env
STRAPI_AUDIT_TOKEN=your-token-here
```
